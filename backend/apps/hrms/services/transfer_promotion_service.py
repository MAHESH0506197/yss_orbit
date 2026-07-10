"""
YSS Orbit — Transfer, Promotion, and Confirmation Services

Handles the complete lifecycle for:
1. TransferService     — dept/location/manager transfers
2. PromotionService    — designation changes + CTC increment + SalaryRevision
3. ConfirmationService — probation end → permanent employee
4. SalaryRevisionService — manual CTC changes

DDD rules:
- Never query payroll models directly — pass computed amounts to payroll via soft FK
- Employee state changes happen atomically with approval
- LifecycleEventPublisher called inside transaction
"""
from __future__ import annotations

import uuid
import logging
from decimal import Decimal
from datetime import date

from django.db import transaction
from django.utils import timezone

from apps.hrms.models.employee import Employee
from apps.hrms.models.lifecycle import (
    EmployeeTransfer, EmployeePromotion, SalaryRevision
)
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher

logger = logging.getLogger(__name__)


class TransferError(Exception):
    pass


class PromotionError(Exception):
    pass


# ─── Transfer Service ─────────────────────────────────────────────────────────

class TransferService:
    """
    Manages formal employee transfers between departments / locations / managers.

    State flow: DRAFT → PENDING → APPROVED/REJECTED/CANCELLED
    On APPROVED: Employee.department, reporting_manager_id updated atomically.
    """

    @staticmethod
    @transaction.atomic
    def initiate(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        to_department_id: uuid.UUID,
        to_designation_id: uuid.UUID | None,
        to_manager_id: uuid.UUID | None,
        to_location: str,
        effective_date: date,
        reason: str,
        initiated_by_id: uuid.UUID,
    ) -> EmployeeTransfer:
        """Initiate a transfer request. Captures 'from' state at the time of request."""
        employee = TransferService._get_active_employee(bu_id, employee_id)

        transfer = EmployeeTransfer.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,

            # Capture current state
            from_department_id=employee.department_id,
            from_designation_id=employee.designation_id,
            from_manager_id=employee.reporting_manager_id,

            # Target state
            to_department_id=to_department_id,
            to_designation_id=to_designation_id,
            to_manager_id=to_manager_id,
            to_location=to_location,

            effective_date=effective_date,
            reason=reason,
            status=EmployeeTransfer.Status.PENDING,
            initiated_by_id=initiated_by_id,
        )

        logger.info("Transfer initiated", extra={
            "transfer_id": str(transfer.id),
            "employee_id": str(employee_id),
        })
        return transfer

    @staticmethod
    @transaction.atomic
    def approve(
        bu_id: uuid.UUID,
        transfer_id: uuid.UUID,
        approved_by_id: uuid.UUID,
        remarks: str = "",
    ) -> EmployeeTransfer:
        """
        Approve a PENDING transfer.
        Applies department, designation, manager changes to Employee atomically.
        """
        try:
            transfer = EmployeeTransfer.objects.select_for_update().get(
                id=transfer_id, business_unit_id=bu_id,
                status=EmployeeTransfer.Status.PENDING,
            )
        except EmployeeTransfer.DoesNotExist:
            raise TransferError(f"Pending transfer {transfer_id} not found.")

        # Apply changes to Employee
        update_fields: dict = {}
        if transfer.to_department_id:
            update_fields["department_id"] = transfer.to_department_id
        if transfer.to_designation_id:
            update_fields["designation_id"] = transfer.to_designation_id
        if transfer.to_manager_id:
            update_fields["reporting_manager_id"] = transfer.to_manager_id

        if update_fields:
            Employee.objects.filter(
                id=transfer.employee_id, business_unit_id=bu_id
            ).update(**update_fields)

        transfer.status = EmployeeTransfer.Status.APPROVED
        transfer.approved_by_id = approved_by_id
        transfer.approved_at = timezone.now()
        transfer.remarks = remarks
        transfer.save(update_fields=["status", "approved_by_id", "approved_at", "remarks", "updated_at"])

        # Publish timeline event
        LifecycleEventPublisher.transferred(
            employee_id=transfer.employee_id,
            bu_id=bu_id,
            from_dept=str(transfer.from_department_id or "—"),
            to_dept=str(transfer.to_department_id or "—"),
            actor_id=approved_by_id,
            reference_id=transfer.id,
            event_date=transfer.effective_date,
        )

        logger.info("Transfer approved", extra={
            "transfer_id": str(transfer_id), "approved_by": str(approved_by_id)
        })
        return transfer

    @staticmethod
    @transaction.atomic
    def reject(
        bu_id: uuid.UUID,
        transfer_id: uuid.UUID,
        rejected_by_id: uuid.UUID,
        remarks: str,
    ) -> EmployeeTransfer:
        try:
            transfer = EmployeeTransfer.objects.select_for_update().get(
                id=transfer_id, business_unit_id=bu_id,
                status=EmployeeTransfer.Status.PENDING,
            )
        except EmployeeTransfer.DoesNotExist:
            raise TransferError(f"Pending transfer {transfer_id} not found.")

        transfer.status = EmployeeTransfer.Status.REJECTED
        transfer.approved_by_id = rejected_by_id
        transfer.approved_at = timezone.now()
        transfer.remarks = remarks
        transfer.save(update_fields=["status", "approved_by_id", "approved_at", "remarks", "updated_at"])
        return transfer

    @staticmethod
    def _get_active_employee(bu_id: uuid.UUID, employee_id: uuid.UUID) -> Employee:
        try:
            return Employee.objects.get(
                id=employee_id, business_unit_id=bu_id,
                employment_status=Employee.EmploymentStatus.ACTIVE,
            )
        except Employee.DoesNotExist:
            raise TransferError(f"Active employee {employee_id} not found.")


# ─── Promotion Service ────────────────────────────────────────────────────────

class PromotionService:
    """
    Manages employee promotions: designation changes + salary increment.

    On APPROVED:
    - Employee.designation updated
    - Employee.ctc + basic_salary updated
    - SalaryRevision created for audit trail
    - LifecycleEventPublisher.promoted() called
    """

    @staticmethod
    @transaction.atomic
    def initiate(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        to_designation_id: uuid.UUID,
        effective_date: date,
        increment_percentage: Decimal,
        new_ctc: Decimal,
        reason: str,
        recommended_by_id: uuid.UUID,
    ) -> EmployeePromotion:
        """Initiate a promotion request. Captures current designation."""
        try:
            employee = Employee.objects.get(id=employee_id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            raise PromotionError(f"Employee {employee_id} not found.")

        old_ctc = employee.ctc
        increment_amount = new_ctc - old_ctc

        promotion = EmployeePromotion.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            from_designation_id=employee.designation_id,
            to_designation_id=to_designation_id,
            effective_date=effective_date,
            increment_percentage=increment_percentage,
            increment_amount=increment_amount,
            new_ctc=new_ctc,
            reason=reason,
            status=EmployeePromotion.Status.PENDING,
            recommended_by_id=recommended_by_id,
        )

        logger.info("Promotion initiated", extra={
            "promotion_id": str(promotion.id), "employee_id": str(employee_id),
            "new_ctc": str(new_ctc),
        })
        return promotion

    @staticmethod
    @transaction.atomic
    def approve(
        bu_id: uuid.UUID,
        promotion_id: uuid.UUID,
        approved_by_id: uuid.UUID,
        remarks: str = "",
    ) -> EmployeePromotion:
        """
        Approve a PENDING promotion.
        Updates Employee.designation, ctc, basic_salary.
        Creates SalaryRevision for audit.
        """
        try:
            promotion = EmployeePromotion.objects.select_for_update().get(
                id=promotion_id, business_unit_id=bu_id,
                status=EmployeePromotion.Status.PENDING,
            )
        except EmployeePromotion.DoesNotExist:
            raise PromotionError(f"Pending promotion {promotion_id} not found.")

        employee = Employee.objects.select_for_update().get(
            id=promotion.employee_id, business_unit_id=bu_id
        )

        old_ctc = employee.ctc
        old_basic = employee.basic_salary
        new_ctc = promotion.new_ctc

        # Basic salary heuristic: if new CTC but no explicit basic, maintain same ratio
        old_basic_ratio = (old_basic / old_ctc) if old_ctc else Decimal("0.4")
        new_basic = (new_ctc * old_basic_ratio).quantize(Decimal("0.01"))

        # Apply promotion to Employee
        employee.designation_id = promotion.to_designation_id
        employee.ctc = new_ctc
        employee.basic_salary = new_basic
        employee.save(update_fields=["designation_id", "ctc", "basic_salary", "updated_at"])

        # Create SalaryRevision audit record
        revision = SalaryRevision.objects.create(
            business_unit_id=bu_id,
            employee_id=promotion.employee_id,
            revision_type=SalaryRevision.RevisionType.PROMOTION,
            effective_date=promotion.effective_date,
            old_ctc=old_ctc,
            new_ctc=new_ctc,
            old_basic=old_basic,
            new_basic=new_basic,
            increment_amount=promotion.increment_amount,
            increment_percentage=promotion.increment_percentage,
            reference_id=promotion.id,
            notes=remarks,
            approved_by_id=approved_by_id,
            approved_at=timezone.now(),
        )

        # Update promotion status
        promotion.status = EmployeePromotion.Status.APPROVED
        promotion.approved_by_id = approved_by_id
        promotion.approved_at = timezone.now()
        promotion.remarks = remarks
        promotion.save(update_fields=["status", "approved_by_id", "approved_at", "remarks", "updated_at"])

        # Timeline event
        LifecycleEventPublisher.promoted(
            employee_id=promotion.employee_id, bu_id=bu_id,
            from_designation=str(promotion.from_designation_id or "—"),
            to_designation=str(promotion.to_designation_id),
            increment_pct=float(promotion.increment_percentage),
            actor_id=approved_by_id,
            reference_id=promotion.id,
            event_date=promotion.effective_date,
        )

        LifecycleEventPublisher.salary_revised(
            employee_id=promotion.employee_id, bu_id=bu_id,
            old_ctc=float(old_ctc), new_ctc=float(new_ctc),
            reason=f"Promotion increment ({promotion.increment_percentage}%)",
            actor_id=approved_by_id,
            reference_id=revision.id,
            event_date=promotion.effective_date,
        )

        logger.info("Promotion approved", extra={
            "promotion_id": str(promotion_id),
            "employee_id": str(promotion.employee_id),
            "new_ctc": str(new_ctc),
        })
        return promotion


# ─── Confirmation Service ─────────────────────────────────────────────────────

class ConfirmationService:
    """
    Confirms an employee at end of probation period.
    Updates employment_type → FULL_TIME and records confirmation_date.
    """

    @staticmethod
    @transaction.atomic
    def confirm(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        confirmation_date: date,
        confirmed_by_id: uuid.UUID,
        increment_pct: Decimal = Decimal("0"),
        remarks: str = "",
    ) -> Employee:
        try:
            employee = Employee.objects.select_for_update().get(
                id=employee_id, business_unit_id=bu_id
            )
        except Employee.DoesNotExist:
            raise PromotionError(f"Employee {employee_id} not found.")

        employee.confirmation_date = confirmation_date
        employee.employment_status = Employee.EmploymentStatus.ACTIVE
        employee.employment_type = Employee.EmploymentType.FULL_TIME
        employee.save(update_fields=[
            "confirmation_date", "employment_status", "employment_type", "updated_at"
        ])

        # Apply increment if any
        if increment_pct > 0:
            old_ctc = employee.ctc
            new_ctc = (old_ctc * (1 + increment_pct / 100)).quantize(Decimal("0.01"))
            old_basic = employee.basic_salary
            new_basic = (old_ctc and (new_ctc * old_basic / old_ctc) or new_ctc * Decimal("0.4"))
            new_basic = new_basic.quantize(Decimal("0.01"))

            Employee.objects.filter(id=employee_id, business_unit_id=bu_id).update(
                ctc=new_ctc, basic_salary=new_basic,
            )

            SalaryRevision.objects.create(
                business_unit_id=bu_id,
                employee_id=employee_id,
                revision_type=SalaryRevision.RevisionType.PROBATION_END,
                effective_date=confirmation_date,
                old_ctc=old_ctc, new_ctc=new_ctc,
                old_basic=old_basic, new_basic=new_basic,
                increment_percentage=increment_pct,
                increment_amount=new_ctc - old_ctc,
                notes=remarks,
                approved_by_id=confirmed_by_id,
                approved_at=timezone.now(),
            )

        LifecycleEventPublisher.confirmed(
            employee_id=employee_id, bu_id=bu_id,
            confirmation_date=str(confirmation_date),
            actor_id=confirmed_by_id,
            event_date=confirmation_date,
        )

        logger.info("Employee confirmed", extra={
            "employee_id": str(employee_id),
            "confirmation_date": str(confirmation_date),
        })
        return employee


# ─── Manual Salary Revision Service ──────────────────────────────────────────

class SalaryRevisionService:
    """Creates a manual off-cycle salary revision (market correction, retention, etc.)"""

    @staticmethod
    @transaction.atomic
    def revise(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        new_ctc: Decimal,
        new_basic: Decimal,
        revision_type: str,
        effective_date: date,
        reason: str,
        approved_by_id: uuid.UUID,
    ) -> SalaryRevision:
        try:
            employee = Employee.objects.select_for_update().get(
                id=employee_id, business_unit_id=bu_id
            )
        except Employee.DoesNotExist:
            raise PromotionError(f"Employee {employee_id} not found.")

        old_ctc = employee.ctc
        old_basic = employee.basic_salary
        increment_amount = new_ctc - old_ctc
        increment_pct = (
            (increment_amount / old_ctc * 100).quantize(Decimal("0.01"))
            if old_ctc else Decimal("0")
        )

        # Update employee
        employee.ctc = new_ctc
        employee.basic_salary = new_basic
        employee.save(update_fields=["ctc", "basic_salary", "updated_at"])

        revision = SalaryRevision.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            revision_type=revision_type,
            effective_date=effective_date,
            old_ctc=old_ctc, new_ctc=new_ctc,
            old_basic=old_basic, new_basic=new_basic,
            increment_amount=increment_amount,
            increment_percentage=increment_pct,
            notes=reason,
            approved_by_id=approved_by_id,
            approved_at=timezone.now(),
        )

        LifecycleEventPublisher.salary_revised(
            employee_id=employee_id, bu_id=bu_id,
            old_ctc=float(old_ctc), new_ctc=float(new_ctc),
            reason=reason,
            actor_id=approved_by_id,
            reference_id=revision.id,
            event_date=effective_date,
        )

        return revision

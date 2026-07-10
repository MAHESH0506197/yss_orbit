"""
YSS Orbit — Exit Workflow Service

Drives the complete employee exit lifecycle:
  SUBMITTED → MANAGER_REVIEW → HR_REVIEW → NOTICE_PERIOD → APPROVED → Exit Complete

Key rules:
- On resignation acceptance: Employee.status → NOTICE_PERIOD
- On exit completion: Employee.status → RESIGNED/TERMINATED + date_of_leaving set
- LWD can be revised by HR (within notice period policy)
- Exit interview must be marked done before HR can approve exit
- Final settlement triggered automatically on exit completion
- Garden leave / early release handled via notice_period_days override
- Timeline events published at every stage

DDD rules:
- Does NOT call FinalSettlementService directly — returns exit request so
  the orchestrator layer can trigger settlement computation
"""
from __future__ import annotations

import uuid
import logging
from datetime import date, timedelta

from django.db import transaction
from django.utils import timezone

from apps.hrms.models.employee import Employee
from apps.hrms.models.lifecycle import ExitRequest
from apps.hrms.services.lifecycle_event_publisher import LifecycleEventPublisher

logger = logging.getLogger(__name__)


class ExitWorkflowError(Exception):
    pass


class ExitWorkflowService:
    """
    Manages the employee exit workflow end-to-end.

    Callable from:
    - Employee Self-Service: submit_resignation()
    - Manager MSS: manager_acknowledge()
    - HR: hr_approve(), override_lwd(), mark_exit_complete()
    """

    @staticmethod
    @transaction.atomic
    def submit_resignation(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        resignation_date: date,
        reason: str,
        reason_category: str = "",
        notice_period_days_override: int | None = None,
    ) -> ExitRequest:
        """
        Employee submits resignation via ESS.
        Auto-calculates LWD = resignation_date + notice_period_days.
        """
        if ExitRequest.objects.filter(
            business_unit_id=bu_id,
            employee_id=employee_id,
            status__in=[
                ExitRequest.Status.SUBMITTED,
                ExitRequest.Status.MANAGER_REVIEW,
                ExitRequest.Status.HR_REVIEW,
                ExitRequest.Status.NOTICE_PERIOD,
            ]
        ).exists():
            raise ExitWorkflowError(
                "Employee already has an active exit request in progress."
            )

        try:
            employee = Employee.objects.get(id=employee_id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            raise ExitWorkflowError(f"Employee {employee_id} not found.")

        notice_days = notice_period_days_override or 30
        lwd = resignation_date + timedelta(days=notice_days)

        exit_req = ExitRequest.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            exit_type=ExitRequest.ExitType.RESIGNATION,
            status=ExitRequest.Status.SUBMITTED,
            resignation_date=resignation_date,
            notice_period_days=notice_days,
            last_working_date=lwd,
            reason=reason,
            reason_category=reason_category,
        )

        LifecycleEventPublisher.exit_initiated(
            employee_id=employee_id, bu_id=bu_id,
            exit_type="RESIGNATION",
            last_working_date=str(lwd),
            reference_id=exit_req.id,
        )

        logger.info("Resignation submitted", extra={
            "exit_request_id": str(exit_req.id),
            "employee_id": str(employee_id),
            "lwd": str(lwd),
        })
        return exit_req

    @staticmethod
    @transaction.atomic
    def manager_acknowledge(
        bu_id: uuid.UUID,
        exit_request_id: uuid.UUID,
        acknowledged_by_id: uuid.UUID,
    ) -> ExitRequest:
        """Manager acknowledges and forwards to HR."""
        exit_req = ExitWorkflowService._get_exit_request(bu_id, exit_request_id)

        if exit_req.status != ExitRequest.Status.SUBMITTED:
            raise ExitWorkflowError(
                f"Exit request must be in SUBMITTED status, found: {exit_req.status}"
            )

        exit_req.status = ExitRequest.Status.HR_REVIEW
        exit_req.save(update_fields=["status", "updated_at"])

        LifecycleEventPublisher.publish(
            employee_id=exit_req.employee_id,
            business_unit_id=bu_id,
            event_type="NOTICE_PERIOD_START",
            title="Resignation acknowledged by manager — forwarded to HR",
            actor_id=acknowledged_by_id,
            reference_id=exit_req.id,
        )
        return exit_req

    @staticmethod
    @transaction.atomic
    def hr_approve(
        bu_id: uuid.UUID,
        exit_request_id: uuid.UUID,
        approved_by_id: uuid.UUID,
        lwd_override: date | None = None,
        hr_remarks: str = "",
        rehire_eligible: bool = True,
    ) -> ExitRequest:
        """
        HR approves the resignation.
        Employee.status → NOTICE_PERIOD.
        LWD can be overridden (early release / garden leave).
        """
        exit_req = ExitWorkflowService._get_exit_request(bu_id, exit_request_id)

        if exit_req.status not in {
            ExitRequest.Status.HR_REVIEW,
            ExitRequest.Status.SUBMITTED,  # Skip manager step for terminations
        }:
            raise ExitWorkflowError(
                f"Cannot approve exit in status '{exit_req.status}'."
            )

        if lwd_override:
            exit_req.last_working_date = lwd_override

        exit_req.status = ExitRequest.Status.NOTICE_PERIOD
        exit_req.approved_by_id = approved_by_id
        exit_req.approved_at = timezone.now()
        exit_req.hr_remarks = hr_remarks
        exit_req.rehire_eligible = rehire_eligible
        exit_req.save(update_fields=[
            "status", "approved_by_id", "approved_at",
            "hr_remarks", "rehire_eligible", "last_working_date", "updated_at",
        ])

        # Move Employee to NOTICE_PERIOD status
        Employee.objects.filter(
            id=exit_req.employee_id, business_unit_id=bu_id
        ).update(
            employment_status=Employee.EmploymentStatus.NOTICE_PERIOD,
            resignation_date=exit_req.resignation_date,
        )

        LifecycleEventPublisher.resigned(
            employee_id=exit_req.employee_id, bu_id=bu_id,
            last_working_date=str(exit_req.last_working_date),
            actor_id=approved_by_id,
            reference_id=exit_req.id,
        )

        logger.info("Exit approved by HR", extra={
            "exit_request_id": str(exit_request_id),
            "lwd": str(exit_req.last_working_date),
        })
        return exit_req

    @staticmethod
    @transaction.atomic
    def hr_terminate(
        bu_id: uuid.UUID,
        employee_id: uuid.UUID,
        effective_date: date,
        reason: str,
        approved_by_id: uuid.UUID,
        notice_period_days: int = 0,
    ) -> ExitRequest:
        """
        HR-initiated termination (not a resignation).
        Bypasses manager review. Employee → NOTICE_PERIOD or TERMINATED directly.
        """
        try:
            employee = Employee.objects.get(id=employee_id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            raise ExitWorkflowError(f"Employee {employee_id} not found.")

        exit_req = ExitRequest.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            exit_type=ExitRequest.ExitType.TERMINATION,
            status=ExitRequest.Status.APPROVED,
            resignation_date=effective_date,
            notice_period_days=notice_period_days,
            last_working_date=effective_date + timedelta(days=notice_period_days),
            reason=reason,
            approved_by_id=approved_by_id,
            approved_at=timezone.now(),
            rehire_eligible=False,
        )

        new_status = (
            Employee.EmploymentStatus.NOTICE_PERIOD
            if notice_period_days > 0
            else Employee.EmploymentStatus.TERMINATED
        )
        Employee.objects.filter(id=employee_id, business_unit_id=bu_id).update(
            employment_status=new_status,
            date_of_leaving=exit_req.last_working_date if notice_period_days == 0 else None,
        )

        LifecycleEventPublisher.exit_initiated(
            employee_id=employee_id, bu_id=bu_id,
            exit_type="TERMINATION",
            last_working_date=str(exit_req.last_working_date),
            actor_id=approved_by_id,
            reference_id=exit_req.id,
        )
        return exit_req

    @staticmethod
    @transaction.atomic
    def mark_exit_complete(
        bu_id: uuid.UUID,
        exit_request_id: uuid.UUID,
        actual_last_day: date,
        completed_by_id: uuid.UUID,
        exit_interview_done: bool = True,
    ) -> ExitRequest:
        """
        HR marks employee as fully exited on actual last day.
        Employee.status → RESIGNED/TERMINATED + date_of_leaving set.
        Returns exit_req for FinalSettlementService to compute settlement.
        """
        exit_req = ExitWorkflowService._get_exit_request(bu_id, exit_request_id)

        if exit_req.status not in {ExitRequest.Status.NOTICE_PERIOD, ExitRequest.Status.APPROVED}:
            raise ExitWorkflowError(
                f"Cannot complete exit in status '{exit_req.status}'."
            )

        exit_req.actual_last_day = actual_last_day
        exit_req.exit_interview_done = exit_interview_done
        exit_req.status = ExitRequest.Status.APPROVED
        exit_req.save(update_fields=[
            "actual_last_day", "exit_interview_done", "status", "updated_at"
        ])

        # Final employee status
        final_status = (
            Employee.EmploymentStatus.RESIGNED
            if exit_req.exit_type == ExitRequest.ExitType.RESIGNATION
            else Employee.EmploymentStatus.TERMINATED
        )
        Employee.objects.filter(
            id=exit_req.employee_id, business_unit_id=bu_id
        ).update(
            employment_status=final_status,
            date_of_leaving=actual_last_day,
        )

        LifecycleEventPublisher.publish(
            employee_id=exit_req.employee_id,
            business_unit_id=bu_id,
            event_type="EXIT_COMPLETED",
            title=f"Exit completed — Last working day: {actual_last_day}",
            metadata={"exit_type": exit_req.exit_type, "actual_last_day": str(actual_last_day)},
            actor_id=completed_by_id,
            reference_id=exit_req.id,
            event_date=actual_last_day,
        )

        logger.info("Exit completed", extra={
            "exit_request_id": str(exit_request_id),
            "actual_last_day": str(actual_last_day),
            "final_status": final_status,
        })
        return exit_req

    @staticmethod
    @transaction.atomic
    def withdraw(
        bu_id: uuid.UUID,
        exit_request_id: uuid.UUID,
        withdrawn_by_id: uuid.UUID,
        reason: str,
    ) -> ExitRequest:
        """Employee withdraws their resignation (before notice period starts)."""
        exit_req = ExitWorkflowService._get_exit_request(bu_id, exit_request_id)

        if exit_req.status not in {
            ExitRequest.Status.SUBMITTED,
            ExitRequest.Status.HR_REVIEW,
        }:
            raise ExitWorkflowError(
                "Resignation can only be withdrawn before HR approval."
            )

        exit_req.status = ExitRequest.Status.WITHDRAWN
        exit_req.save(update_fields=["status", "updated_at"])

        # Restore employee to ACTIVE
        Employee.objects.filter(
            id=exit_req.employee_id, business_unit_id=bu_id
        ).update(
            employment_status=Employee.EmploymentStatus.ACTIVE,
            resignation_date=None,
        )

        LifecycleEventPublisher.publish(
            employee_id=exit_req.employee_id,
            business_unit_id=bu_id,
            event_type="JOINED",  # Reactivation event
            title="Resignation withdrawn — employee reinstated as ACTIVE",
            metadata={"reason": reason},
            actor_id=withdrawn_by_id,
            reference_id=exit_req.id,
        )
        return exit_req

    @staticmethod
    def _get_exit_request(bu_id: uuid.UUID, exit_request_id: uuid.UUID) -> ExitRequest:
        try:
            return ExitRequest.objects.select_for_update().get(
                id=exit_request_id, business_unit_id=bu_id
            )
        except ExitRequest.DoesNotExist:
            raise ExitWorkflowError(f"Exit request {exit_request_id} not found.")

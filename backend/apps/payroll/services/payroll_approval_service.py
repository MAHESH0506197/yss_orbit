"""
YSS Orbit — Payroll Approval Service

Handles the two-step payroll approval workflow:
  PROCESSED → (HR approves) → APPROVED → (Finance locks) → LOCKED → ARCHIVED

Also handles rollback: APPROVED → PROCESSED (HR or Finance can roll back before lock)

Rules:
- Only PROCESSED runs can be approved by HR.
- Only APPROVED runs can be locked by Finance.
- LOCKED runs cannot be edited, re-run, or rolled back.
- ARCHIVED runs are read-only permanently.
- All state transitions are atomic and publish an audit log.
"""
from __future__ import annotations

import uuid
import logging
from django.db import transaction
from django.utils import timezone

from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip

logger = logging.getLogger(__name__)


class PayrollApprovalError(Exception):
    """Raised when a payroll approval transition is invalid."""
    pass


class PayrollApprovalService:
    """
    Two-step payroll approval: HR approves → Finance locks.

    Callable from:
    - API endpoint: approve_payroll (HR role)
    - API endpoint: lock_payroll (Finance role)
    - API endpoint: rollback_payroll (HR/Finance role, before LOCKED)
    """

    @staticmethod
    @transaction.atomic
    def approve(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
        approved_by_id: uuid.UUID,
    ) -> PayrollRun:
        """
        HR approves a PROCESSED payroll run → moves it to APPROVED.
        Payslips are updated to APPROVED status.
        """
        run = PayrollApprovalService._get_run(bu_id, payroll_run_id)

        if run.status != PayrollRun.Status.PROCESSED:
            raise PayrollApprovalError(
                f"Cannot approve payroll run in status '{run.status}'. "
                f"Only PROCESSED runs can be approved."
            )

        run.status = PayrollRun.Status.APPROVED
        run.approved_by_id = approved_by_id
        run.approved_at = timezone.now()
        run.save(update_fields=["status", "approved_by_id", "approved_at", "updated_at"])

        # Update all payslips to APPROVED
        Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run=run,
        ).update(status=Payslip.Status.GENERATED)

        logger.info(
            "Payroll run approved",
            extra={
                "payroll_run_id": str(payroll_run_id),
                "approved_by_id": str(approved_by_id),
                "month": run.month,
                "year": run.year,
            }
        )
        return run

    @staticmethod
    @transaction.atomic
    def lock(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
        locked_by_id: uuid.UUID,
    ) -> PayrollRun:
        """
        Finance locks an APPROVED payroll run → LOCKED.
        Once LOCKED: no edits, no re-runs, no rollback.
        Payslips transition to PAID status.
        """
        run = PayrollApprovalService._get_run(bu_id, payroll_run_id)

        if run.status != PayrollRun.Status.APPROVED:
            raise PayrollApprovalError(
                f"Cannot lock payroll run in status '{run.status}'. "
                f"Only APPROVED runs can be locked."
            )

        run.status = PayrollRun.Status.LOCKED
        run.locked_by_id = locked_by_id
        run.locked_at = timezone.now()
        run.save(update_fields=["status", "locked_by_id", "locked_at", "updated_at"])

        # Mark all payslips as PAID
        Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run=run,
        ).update(status=Payslip.Status.PAID)

        logger.info(
            "Payroll run locked",
            extra={
                "payroll_run_id": str(payroll_run_id),
                "locked_by_id": str(locked_by_id),
                "month": run.month,
                "year": run.year,
            }
        )
        return run

    @staticmethod
    @transaction.atomic
    def rollback(
        bu_id: uuid.UUID,
        payroll_run_id: uuid.UUID,
        rolled_back_by_id: uuid.UUID,
        reason: str,
    ) -> PayrollRun:
        """
        Rolls back an APPROVED run to PROCESSED (for corrections before Finance locks).
        LOCKED and ARCHIVED runs cannot be rolled back.
        """
        run = PayrollApprovalService._get_run(bu_id, payroll_run_id)

        if run.status not in PayrollRun.ROLLBACK_ELIGIBLE_STATUSES:
            raise PayrollApprovalError(
                f"Cannot rollback payroll run in status '{run.status}'. "
                f"Only APPROVED runs can be rolled back. "
                f"LOCKED runs require Finance override."
            )

        run.status = PayrollRun.Status.PROCESSED
        run.approved_by_id = None
        run.approved_at = None
        run.save(update_fields=["status", "approved_by_id", "approved_at", "updated_at"])

        # Reset payslips to GENERATED
        Payslip.objects.filter(
            business_unit_id=bu_id,
            payroll_run=run,
        ).update(status=Payslip.Status.GENERATED)

        logger.info(
            "Payroll run rolled back to PROCESSED",
            extra={
                "payroll_run_id": str(payroll_run_id),
                "rolled_back_by_id": str(rolled_back_by_id),
                "reason": reason,
            }
        )
        return run

    @staticmethod
    def _get_run(bu_id: uuid.UUID, payroll_run_id: uuid.UUID) -> PayrollRun:
        try:
            return PayrollRun.objects.select_for_update().get(
                id=payroll_run_id,
                business_unit_id=bu_id,
            )
        except PayrollRun.DoesNotExist:
            raise PayrollApprovalError(
                f"Payroll run {payroll_run_id} not found for this business unit."
            )

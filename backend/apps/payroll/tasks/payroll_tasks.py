# yss_orbit/backend/apps/payroll/tasks/payroll_tasks.py
"""
Celery tasks for the payroll app.
Beat-scheduled tasks for archive and payslip notifications.
"""
from __future__ import annotations

import logging
from datetime import datetime

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def process_payroll_task(record_id: str):
    logger.info(f"Processing task for Payroll {record_id}")
    try:
        # Task implementation
        pass
    except Exception as e:
        logger.error(f"Error processing Payroll task: {e}")
        raise


# ---------------------------------------------------------------------------
# Beat-scheduled tasks (Phase 3)
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    queue="queue_payroll",
    max_retries=1,
    default_retry_delay=600,
    acks_late=True,
    name="payroll.archive_payroll_runs",
)
def archive_payroll_runs_task(self, years: int = 7, dry_run: bool = False) -> dict:
    """
    Beat-scheduled wrapper for the archive_old_payroll_runs management command.
    Runs annually on January 1st at 02:00 UTC.
    Archives LOCKED PayrollRun records older than `years` years.
    """
    from django.utils import timezone
    from datetime import timedelta
    from apps.payroll.models.payroll_run_model import PayrollRun

    cutoff_date = timezone.now() - timedelta(days=years * 365)
    eligible_qs = PayrollRun.objects.filter(
        status=PayrollRun.Status.LOCKED,
        locked_at__lt=cutoff_date,
    )
    count = eligible_qs.count()

    if dry_run:
        logger.info("archive_payroll_runs_task DRY RUN: would archive %d runs", count)
        return {"dry_run": True, "would_archive": count}

    archived = 0
    errors = 0
    for run in eligible_qs.select_for_update():
        try:
            run.status = PayrollRun.Status.ARCHIVED
            run.archived_at = timezone.now()
            run.save(update_fields=["status", "archived_at", "updated_at"])
            archived += 1
        except Exception as exc:
            logger.error("Failed to archive run %s: %s", run.id, exc, exc_info=True)
            errors += 1

    logger.info("archive_payroll_runs_task: archived=%d errors=%d", archived, errors)
    return {"archived": archived, "errors": errors, "total_eligible": count}


@shared_task(
    bind=True,
    queue="queue_notifications",
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
    name="payroll.notify_payslip_available",
)
def notify_payslip_available_task(self) -> dict:
    """
    Beat-scheduled: runs on the 5th of each month at 06:00 UTC.
    Dispatches PAYSLIP_AVAILABLE in-app + email to all employees who have
    a payslip for the PREVIOUS month in a LOCKED or PROCESSED payroll run.
    """
    from apps.platform.services import NotificationService
    from apps.payroll.models.payslip import Payslip
    from apps.payroll.models.payroll_run_model import PayrollRun
    from apps.hrms.models.employee import Employee

    today = datetime.utcnow()
    # Previous month
    if today.month == 1:
        target_month, target_year = 12, today.year - 1
    else:
        target_month, target_year = today.month - 1, today.year

    month_label = datetime(target_year, target_month, 1).strftime("%B %Y")
    dispatched = 0
    errors = 0

    # Fetch all LOCKED/PROCESSED payslips for previous month
    payslips = Payslip.objects.filter(
        payroll_run__month=target_month,
        payroll_run__year=target_year,
        payroll_run__status__in=[PayrollRun.Status.LOCKED, PayrollRun.Status.PROCESSED],
    ).select_related("payroll_run")

    for payslip in payslips:
        try:
            emp = Employee.objects.filter(
                business_unit_id=payslip.business_unit_id,
                employee_code=payslip.employee_code,
            ).first()
            if emp is None or emp.user_id is None:
                continue

            NotificationService.notify_payslip_available(
                business_unit_id=payslip.business_unit_id,
                recipient_user_id=emp.user_id,
                employee_name=f"{emp.first_name} {emp.last_name}",
                month=month_label,
                payslip_url=f"/ess/payslips/{payslip.id}",
                correlation_id=f"payslip-notif-{payslip.id}",
            )
            dispatched += 1
        except Exception as exc:
            logger.error("payslip notif failed payslip=%s: %s", payslip.id, exc, exc_info=True)
            errors += 1

    logger.info(
        "notify_payslip_available_task: month=%s dispatched=%d errors=%d",
        month_label, dispatched, errors,
    )
    return {"month": month_label, "dispatched": dispatched, "errors": errors}

# yss_orbit/backend/apps/hrms/tasks/notification_tasks.py
"""
Celery tasks: scheduled HR notification sweeps.

These tasks are designed to run nightly via Celery Beat. They scan for
conditions that require proactive notifications (document expiry, IT declaration
deadlines, contract end approaching) and dispatch notifications in bulk.

Each task is idempotent — running it twice for the same day produces no
duplicate notifications (deduplication via NotificationLog.correlation_id).
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    queue="queue_notifications",
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
    name="hrms.notify_document_expiry",
)
def notify_document_expiry_task(self) -> dict:
    """
    Nightly sweep: notify HR + employee for documents expiring in 30, 7, and 0 days.
    Runs every day at 08:00 IST via Celery Beat.
    """
    from apps.hrms.models.employee import Employee, EmploymentStatus
    from apps.hrms.models.onboarding import EmployeeDocument
    from apps.platform.services import NotificationService

    today = date.today()
    thresholds = [30, 7, 0]
    results = {"dispatched": 0, "errors": 0}

    for days_ahead in thresholds:
        target_date = today + timedelta(days=days_ahead)
        expiring_docs = EmployeeDocument.objects.filter(
            expiry_date=target_date,
            employee__employment_status=EmploymentStatus.ACTIVE,
        ).select_related("employee")

        for doc in expiring_docs:
            emp = doc.employee
            if emp.user_id is None:
                continue
            try:
                NotificationService.notify_doc_expiry(
                    business_unit_id=emp.business_unit_id,
                    recipient_user_id=emp.user_id,
                    employee_name=f"{emp.first_name} {emp.last_name}",
                    document_type=doc.document_type,
                    expiry_date=str(doc.expiry_date),
                    days_remaining=days_ahead,
                    correlation_id=f"doc-expiry-{doc.id}-{today}",
                )
                results["dispatched"] += 1
            except Exception as exc:
                logger.error("doc expiry notification failed doc=%s: %s", doc.id, exc)
                results["errors"] += 1

    logger.info("notify_document_expiry_task complete: %s", results)
    return results


@shared_task(
    bind=True,
    queue="queue_notifications",
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
    name="hrms.notify_it_declaration_deadline",
)
def notify_it_declaration_deadline_task(self) -> dict:
    """
    Sweep: remind employees who have DRAFT or no IT declaration close to the
    annual deadline (March 1 = 30-day warning, March 15 = 15-day warning).
    Runs daily at 09:00 IST via Celery Beat.
    """
    from apps.hrms.models.employee import Employee, EmploymentStatus
    from apps.payroll.models.tax_declaration_model import EmployeeTaxDeclaration
    from apps.platform.services import NotificationService

    today = date.today()
    # Only send in February–March (reminder period for the financial year)
    if today.month not in (2, 3):
        return {"skipped": "outside reminder window"}

    # Employees with DRAFT declarations (not yet submitted/verified)
    draft_declarations = EmployeeTaxDeclaration.objects.filter(
        status=EmployeeTaxDeclaration.Status.DRAFT,
        financial_year=f"{today.year - 1 if today.month < 4 else today.year}-"
                       f"{str((today.year if today.month >= 4 else today.year))[2:]}",
    ).select_related()

    results = {"dispatched": 0, "errors": 0}

    for decl in draft_declarations:
        try:
            # Look up the employee to get user_id
            emp = Employee.objects.filter(
                business_unit_id=decl.business_unit_id,
                id=decl.employee_id,
                employment_status=EmploymentStatus.ACTIVE,
            ).first()
            if emp is None or emp.user_id is None:
                continue

            NotificationService.dispatch(
                business_unit_id=decl.business_unit_id,
                event_type="IT_DECLARATION_DUE",
                recipient_user_id=emp.user_id,
                context={
                    "employee_name": f"{emp.first_name} {emp.last_name}",
                    "financial_year": decl.financial_year,
                    "deadline_date": f"31 March {today.year if today.month < 4 else today.year + 1}",
                },
                correlation_id=f"it-decl-{decl.id}-{today}",
            )
            results["dispatched"] += 1
        except Exception as exc:
            logger.error("IT declaration notification failed decl=%s: %s", decl.id, exc)
            results["errors"] += 1

    logger.info("notify_it_declaration_deadline_task complete: %s", results)
    return results

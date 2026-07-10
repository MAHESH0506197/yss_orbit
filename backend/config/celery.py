# yss_orbit\backend\config\celery.py
"""
YSS Orbit — Celery Application
Configures Celery with queue isolation, structured logging, and correlation ID propagation.
"""
from __future__ import annotations

import logging
import os
import uuid

from celery import Celery
from celery.signals import (
    after_setup_logger,
    before_task_publish,
    task_failure,
    task_postrun,
    task_prerun,
    task_retry,
    worker_init,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application Setup
# ---------------------------------------------------------------------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("yss_orbit")

# Load configuration from Django settings (CELERY_ prefixed vars)
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ---------------------------------------------------------------------------
# Queue Configuration
# ---------------------------------------------------------------------------
# Define all 7 queues with priorities
app.conf.task_queues = {
    "queue_outbox": {
        "exchange": "queue_outbox",
        "routing_key": "queue_outbox",
        "queue_arguments": {"x-max-priority": 10},
    },
    "queue_payroll": {
        "exchange": "queue_payroll",
        "routing_key": "queue_payroll",
        "queue_arguments": {"x-max-priority": 5},
    },
    "queue_hrms": {
        "exchange": "queue_hrms",
        "routing_key": "queue_hrms",
        "queue_arguments": {"x-max-priority": 5},
    },
    "queue_inventory": {
        "exchange": "queue_inventory",
        "routing_key": "queue_inventory",
        "queue_arguments": {"x-max-priority": 5},
    },
    "queue_notifications": {
        "exchange": "queue_notifications",
        "routing_key": "queue_notifications",
        "queue_arguments": {"x-max-priority": 8},  # Higher priority for user-facing
    },
    "queue_reports": {
        "exchange": "queue_reports",
        "routing_key": "queue_reports",
        "queue_arguments": {"x-max-priority": 3},
    },
    "queue_default": {
        "exchange": "queue_default",
        "routing_key": "queue_default",
        "queue_arguments": {"x-max-priority": 5},
    },
}

app.conf.task_default_queue = "queue_default"
app.conf.task_default_exchange = "queue_default"
app.conf.task_default_routing_key = "queue_default"


# ---------------------------------------------------------------------------
# Signals — Structured Logging + Correlation ID Propagation
# ---------------------------------------------------------------------------

@after_setup_logger.connect
def configure_logging(logger_instance, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Apply JSON formatter to Celery loggers."""
    from pythonjsonlogger.jsonlogger import JsonFormatter
    formatter = JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s "
        "%(task_id)s %(task_name)s %(correlation_id)s %(business_unit_id)s"
    )
    for handler in logger_instance.handlers:
        handler.setFormatter(formatter)


@before_task_publish.connect
def inject_correlation_id(headers: dict, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Ensure every task has a correlation_id before publishing."""
    if "correlation_id" not in headers:
        headers["correlation_id"] = str(uuid.uuid4())
    if "request_id" not in headers:
        headers["request_id"] = str(uuid.uuid4())


@task_prerun.connect
def task_prerun_handler(task_id: str, task: object, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Log task start with correlation ID."""
    correlation_id = getattr(task.request, "correlation_id", "unknown")  # type: ignore[union-attr]
    business_unit_id = getattr(task.request, "business_unit_id", None)  # type: ignore[union-attr]
    logger.info(
        "Task started",
        extra={
            "task_id": task_id,
            "task_name": task.name,  # type: ignore[union-attr]
            "correlation_id": correlation_id,
            "business_unit_id": str(business_unit_id) if business_unit_id else None,
        },
    )


@task_postrun.connect
def task_postrun_handler(
    task_id: str, task: object, state: str, *args, **kwargs
) -> None:  # type: ignore[no-untyped-def]
    """Log task completion."""
    correlation_id = getattr(task.request, "correlation_id", "unknown")  # type: ignore[union-attr]
    logger.info(
        "Task completed",
        extra={
            "task_id": task_id,
            "task_name": task.name,  # type: ignore[union-attr]
            "state": state,
            "correlation_id": correlation_id,
        },
    )


@task_failure.connect
def task_failure_handler(
    task_id: str, exception: Exception, traceback: object, *args, **kwargs
) -> None:  # type: ignore[no-untyped-def]
    """Log task failure with Sentry capture."""
    logger.error(
        "Task failed",
        extra={
            "task_id": task_id,
            "exception": str(exception),
            "exception_type": type(exception).__name__,
        },
        exc_info=True,
    )
    # Capture in Sentry
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(exception)
    except Exception:
        pass


@task_retry.connect
def task_retry_handler(request: object, reason: Exception, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Log task retry events."""
    logger.warning(
        "Task retrying",
        extra={
            "task_id": request.id,  # type: ignore[union-attr]
            "task_name": request.task,  # type: ignore[union-attr]
            "retry_count": request.retries,  # type: ignore[union-attr]
            "reason": str(reason),
            "correlation_id": getattr(request, "correlation_id", "unknown"),  # type: ignore[union-attr]
        },
    )


@worker_init.connect
def worker_init_handler(*args, **kwargs) -> None:  # type: ignore[no-untyped-def]
    """Initialize Sentry on worker startup."""
    from django.conf import settings
    if settings.SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.celery import CeleryIntegration
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[CeleryIntegration()],
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            environment=settings.SENTRY_ENVIRONMENT,
        )


# ---------------------------------------------------------------------------
# Celery Beat Schedules
# Phase 3 — YSS Orbit Master Implementation Plan v4
# ---------------------------------------------------------------------------
# All times are in UTC. IST = UTC+5:30.
# ---------------------------------------------------------------------------
from celery.schedules import crontab  # noqa: E402 (after app init)
from datetime import datetime  # noqa: E402


def _current_month_year() -> tuple[int, int]:
    """Return (year, month) for the previous month — used by the snapshot task args."""
    today = datetime.utcnow()
    if today.month == 1:
        return today.year - 1, 12
    return today.year, today.month - 1


app.conf.beat_schedule = {
    # ── Analytics Snapshot ────────────────────────────────────────────────
    # Runs at 02:00 UTC (07:30 IST) on the 2nd of each month.
    # Computes the PREVIOUS month's snapshot for all active BUs.
    # The 2nd-of-month schedule ensures payroll has been run and locked
    # before the snapshot is computed.
    "generate-monthly-hr-analytics-snapshot": {
        "task": "hrms.generate_analytics_snapshot",
        "schedule": crontab(hour=2, minute=0, day_of_month=2),
        # NOTE: year/month args are injected dynamically by the task itself
        # when business_unit_id is None (it reads the previous month).
        "kwargs": {},
        "options": {"queue": "queue_reports"},
    },

    # ── Document Expiry Notifications ─────────────────────────────────────
    # Runs daily at 02:30 UTC (08:00 IST).
    # Sweeps for documents expiring in 30, 7, and 0 days and dispatches
    # notifications to the employee (and optionally HR).
    "notify-document-expiry-daily": {
        "task": "hrms.notify_document_expiry",
        "schedule": crontab(hour=2, minute=30),
        "options": {"queue": "queue_notifications"},
    },

    # ── IT Declaration Deadline Reminders ─────────────────────────────────
    # Runs daily at 03:30 UTC (09:00 IST) during February–March.
    # The task self-gates on month — safe to run year-round.
    "notify-it-declaration-deadline-daily": {
        "task": "hrms.notify_it_declaration_deadline",
        "schedule": crontab(hour=3, minute=30),
        "options": {"queue": "queue_notifications"},
    },

    # ── Annual Payroll Archive ────────────────────────────────────────────
    # Runs at 02:00 UTC on January 1st each year.
    # Archives LOCKED PayrollRuns older than 7 years (statutory retention).
    # This is a management-command-backed task.
    "archive-old-payroll-runs-annual": {
        "task": "payroll.archive_payroll_runs",
        "schedule": crontab(hour=2, minute=0, day_of_month=1, month_of_year=1),
        "kwargs": {"years": 7, "dry_run": False},
        "options": {"queue": "queue_payroll"},
    },

    # ── Monthly Payslip Availability Notifications ────────────────────────
    # Runs at 06:00 UTC (11:30 IST) on the 5th of each month.
    # Dispatches PAYSLIP_AVAILABLE in-app + email to all employees
    # for the previous month's payslip. The payroll task must complete
    # and be LOCKED before this runs (hence the 5th-of-month schedule).
    "notify-payslip-available-monthly": {
        "task": "payroll.notify_payslip_available",
        "schedule": crontab(hour=6, minute=0, day_of_month=5),
        "options": {"queue": "queue_notifications"},
    },
}

app.conf.beat_scheduler = "django_celery_beat.schedulers:DatabaseScheduler"

# yss_orbit\backend\apps\error_log\tasks\error_log_tasks.py
import logging
from typing import Any, Optional
from celery import shared_task
from apps.compliance.services.error_log_service import record_error
from apps.compliance.models import ErrorLog

logger = logging.getLogger(__name__)

@shared_task(name="apps.compliance.tasks.process_error_log_task")
def process_error_log_task(
    exception_str: str,
    message: Optional[str] = None,
    severity: str = ErrorLog.Severity.ERROR,
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    business_unit_id: Optional[str] = None,
    correlation_id: str = ""
):
    """
    Asynchronously process and record an error log.
    """
    logger.info(f"Async processing error log: {exception_str}")
    try:
        exc = Exception(exception_str)
        record_error(
            exception=exc,
            message=message,
            severity=severity,
            user_id=user_id,
            organization_id=organization_id,
            business_unit_id=business_unit_id,
            correlation_id=correlation_id
        )
    except Exception as e:
        logger.error(f"Failed to process error log task: {e}")

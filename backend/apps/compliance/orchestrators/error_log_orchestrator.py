# yss_orbit\backend\apps\error_log\orchestrators\error_log_orchestrator.py
import logging
from typing import Any, Optional
from django.http import HttpRequest
from apps.compliance.services.error_log_service import record_error
from apps.compliance.models import ErrorLog
from apps.compliance.tasks.error_log_tasks import process_error_log_task

logger = logging.getLogger(__name__)

class ErrorLogOrchestrator:
    """
    Orchestrator for managing error logs.
    """
    
    def process(
        self,
        exception: Exception,
        message: Optional[str] = None,
        severity: str = ErrorLog.Severity.ERROR,
        request: Optional[HttpRequest] = None,
        user_id: Optional[Any] = None,
        organization_id: Optional[Any] = None,
        business_unit_id: Optional[Any] = None,
        correlation_id: str = "",
        async_processing: bool = False
    ) -> Optional[ErrorLog]:
        """
        Process and record an error log. Can be processed synchronously or sent to a celery task.
        """
        logger.info(f"Orchestrator processing error log for: {exception}")
        
        if async_processing:
            process_error_log_task.delay(
                exception_str=str(exception),
                message=message,
                severity=severity,
                user_id=str(user_id) if user_id else None,
                organization_id=str(organization_id) if organization_id else None,
                business_unit_id=str(business_unit_id) if business_unit_id else None,
                correlation_id=correlation_id
            )
            return None

        return record_error(
            exception=exception,
            message=message,
            severity=severity,
            request=request,
            user_id=user_id,
            organization_id=organization_id,
            business_unit_id=business_unit_id,
            correlation_id=correlation_id
        )

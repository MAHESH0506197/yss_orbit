# yss_orbit\backend\apps\error_log\services\error_log_service.py
import logging
import traceback
import sys
from typing import Any, Dict, Optional
from django.http import HttpRequest

from apps.compliance.models import ErrorLog

logger = logging.getLogger(__name__)

def record_error(
    exception: Exception,
    message: Optional[str] = None,
    severity: str = ErrorLog.Severity.ERROR,
    request: Optional[HttpRequest] = None,
    user_id: Optional[Any] = None,
    organization_id: Optional[Any] = None,
    business_unit_id: Optional[Any] = None,
    correlation_id: str = "",
) -> Optional[ErrorLog]:
    """
    Record an exception in the error log.
    Captures traceback and request details automatically if provided.
    """
    try:
        exc_type = type(exception).__name__
        tb_str = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__))
        
        err_msg = message or str(exception)
        
        endpoint = ""
        http_method = ""
        ip_address = None
        user_agent = ""
        request_data = None
        
        if request:
            endpoint = request.path
            http_method = request.method or ""
            ip_address = _get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Safely capture request data
            try:
                if request.method in ["POST", "PUT", "PATCH"]:
                    import json
                    if request.content_type == "application/json":
                        request_data = json.loads(request.body)
                    else:
                        request_data = request.POST.dict()
            except Exception:
                request_data = {"error": "Failed to parse request data"}

        log_entry = ErrorLog.objects.create(
            message=err_msg,
            exception_type=exc_type,
            traceback=tb_str,
            severity=severity,
            user_id=user_id,
            organization_id=organization_id,
            business_unit_id=business_unit_id,
            endpoint=endpoint,
            http_method=http_method,
            ip_address=ip_address,
            user_agent=user_agent,
            request_data=request_data,
            correlation_id=correlation_id,
        )
        return log_entry
        
    except Exception as e:
        logger.error(f"Failed to record error log: {str(e)}", exc_info=True)
        return None

def _get_client_ip(request: HttpRequest) -> str:
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip

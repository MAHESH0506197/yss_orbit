# yss_orbit\backend\apps\observability\services\trace_service.py
from apps.observability.models.observability_model import RequestTrace
from apps.observability.services.correlation_service import CorrelationService

class TraceService:
    """
    Service for writing HTTP request traces.
    """
    @staticmethod
    def record_trace(method: str, path: str, status_code: int, duration_ms: float, user_id: int = None, tenant_id: int = None, ip_address: str = None):
        trace_id = CorrelationService.get_trace_id() or CorrelationService.generate_trace_id()
        RequestTrace.objects.create(
            trace_id=trace_id,
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id,
            tenant_id=tenant_id,
            ip_address=ip_address
        )

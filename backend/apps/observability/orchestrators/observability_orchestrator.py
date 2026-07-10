# yss_orbit\backend\apps\observability\orchestrators\observability_orchestrator.py
from apps.observability.services.metrics_service import MetricsService
from apps.observability.services.trace_service import TraceService

class ObservabilityOrchestrator:
    """
    Orchestrates observability flows.
    """
    @staticmethod
    def capture_request_telemetry(method: str, path: str, status_code: int, duration_ms: float, user_id: int = None, tenant_id: int = None, ip_address: str = None):
        TraceService.record_trace(method, path, status_code, duration_ms, user_id, tenant_id, ip_address)
        MetricsService.record_metric('http_request_duration_ms', duration_ms, {'method': method, 'status_code': status_code})

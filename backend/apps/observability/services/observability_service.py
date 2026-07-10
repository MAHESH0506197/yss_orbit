# yss_orbit\backend\apps\observability\services\observability_service.py
from apps.observability.services.metrics_service import MetricsService
from apps.observability.services.trace_service import TraceService
from apps.observability.services.slo_service import SloService

class ObservabilityService:
    """
    Facade combining metrics, traces, and SLOs.
    """
    pass

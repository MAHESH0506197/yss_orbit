# yss_orbit\backend\apps\observability\services\metrics_service.py
from apps.observability.models.metrics_model import SystemMetric

class MetricsService:
    """
    Service for writing/recording system metrics.
    """
    @staticmethod
    def record_metric(name: str, value: float, labels: dict = None):
        # In a real environment, this might aggregate in memory and flush to Prometheus.
        # Here we write to DB for standalone.
        SystemMetric.objects.create(
            metric_name=name,
            metric_value=value,
            labels=labels or {}
        )

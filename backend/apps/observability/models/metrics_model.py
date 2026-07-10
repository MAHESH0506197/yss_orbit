# yss_orbit\backend\apps\observability\models\metrics_model.py
from django.db import models

class SystemMetric(models.Model):
    """
    Time-series model to store system metrics (CPU, Memory, Request latency).
    In a real massive-scale enterprise, this might be sent to Prometheus/Datadog, 
    but we keep a local abstraction for standalone deployments.
    """
    metric_name = models.CharField(max_length=100, db_index=True)
    metric_value = models.FloatField()
    labels = models.JSONField(default=dict, help_text="Dimensions like {'host': 'web1', 'endpoint': '/api/v1/user/'}")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'observability_metrics'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.metric_name}: {self.metric_value} @ {self.timestamp}"

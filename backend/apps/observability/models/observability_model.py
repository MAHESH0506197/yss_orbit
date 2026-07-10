# yss_orbit\backend\apps\observability\models\observability_model.py
from django.db import models

class RequestTrace(models.Model):
    """
    Stores HTTP request tracing (OpenTelemetry-like).
    Used for debugging slow requests and analyzing traffic patterns in Orbit.
    """
    trace_id = models.CharField(max_length=64, db_index=True)
    span_id = models.CharField(max_length=64, null=True, blank=True)
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    status_code = models.IntegerField()
    duration_ms = models.FloatField()
    user_id = models.IntegerField(null=True, blank=True)
    tenant_id = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'observability_traces'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.method}] {self.path} - {self.status_code} ({self.duration_ms}ms)"

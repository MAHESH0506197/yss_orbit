# yss_orbit\backend\apps\observability\api\views\metrics_view.py
from rest_framework import generics, permissions
from apps.observability.models.metrics_model import SystemMetric
from apps.observability.api.serializers.observability_serializer import SystemMetricSerializer

class MetricsView(generics.ListAPIView):
    """
    API view to query system metrics (e.g., CPU, latency, memory) for dashboard rendering.
    """
    serializer_class = SystemMetricSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return SystemMetric.objects.all().order_by('-timestamp')

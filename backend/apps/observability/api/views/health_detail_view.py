# yss_orbit\backend\apps\health\api\views\health_detail_view.py
from rest_framework import generics, permissions
from apps.observability.models.health_model import SystemHealthLog
from apps.observability.api.serializers.health_serializer import HealthLogSerializer

class HealthLogDetailView(generics.RetrieveAPIView):
    """
    API view to retrieve specific health check log details.
    """
    serializer_class = HealthLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return SystemHealthLog.objects.all()

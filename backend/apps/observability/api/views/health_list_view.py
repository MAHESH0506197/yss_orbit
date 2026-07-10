# yss_orbit\backend\apps\health\api\views\health_list_view.py
from rest_framework import generics, permissions
from apps.observability.models.health_model import SystemHealthLog
from apps.observability.api.serializers.health_serializer import HealthLogSerializer

class HealthLogListView(generics.ListAPIView):
    """
    API view to retrieve historical health check logs.
    Restricted to superusers or platform admins.
    """
    serializer_class = HealthLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return SystemHealthLog.objects.all()

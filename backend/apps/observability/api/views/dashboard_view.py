# yss_orbit\backend\apps\dashboard\api\views\dashboard_view.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.observability.models import Dashboard
from apps.observability.api.serializers.dashboard_serializer import DashboardSerializer

class DashboardViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dashboard.objects.all()

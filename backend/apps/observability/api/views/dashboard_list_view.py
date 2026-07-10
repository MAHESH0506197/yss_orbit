# yss_orbit\backend\apps\dashboard\api\views\dashboard_list_view.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.observability.models import Dashboard
from apps.observability.api.serializers.dashboard_serializer import DashboardSerializer

class DashboardListView(generics.ListAPIView):
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dashboard.objects.all()

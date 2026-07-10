# yss_orbit\backend\apps\dashboard\api\views\widget_view.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.observability.models import DashboardWidget
from apps.observability.api.serializers.dashboard_serializer import DashboardWidgetSerializer

class DashboardWidgetViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DashboardWidget.objects.all()

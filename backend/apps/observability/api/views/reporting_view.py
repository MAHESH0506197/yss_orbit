# yss_orbit\backend\apps\reporting\api\views\reporting_view.py
from rest_framework import viewsets, permissions
from apps.observability.models.reporting import Reporting
from apps.observability.api.serializers.reporting_serializer import ReportingSerializer

class ReportingViewSet(viewsets.ModelViewSet):
    queryset = Reporting.objects.all()
    serializer_class = ReportingSerializer
    permission_classes = [permissions.IsAuthenticated]

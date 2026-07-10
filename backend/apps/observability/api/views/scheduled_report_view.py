# yss_orbit\backend\apps\reporting\api\views\scheduled_report_view.py
from rest_framework import viewsets, permissions
from apps.observability.models.scheduled_report import ScheduledReport
from apps.observability.api.serializers.scheduled_report_serializer import ScheduledReportSerializer

class ScheduledReportViewSet(viewsets.ModelViewSet):
    queryset = ScheduledReport.objects.all()
    serializer_class = ScheduledReportSerializer
    permission_classes = [permissions.IsAuthenticated]

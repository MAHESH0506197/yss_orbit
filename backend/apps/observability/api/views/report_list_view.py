# yss_orbit\backend\apps\reporting\api\views\report_list_view.py
from rest_framework import viewsets, permissions
from apps.observability.models.report import Report
from apps.observability.api.serializers.report_serializer import ReportSerializer

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

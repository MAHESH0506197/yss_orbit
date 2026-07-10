# yss_orbit\backend\apps\reporting\api\views\report_export_view.py
from rest_framework import viewsets, permissions
from apps.observability.models.report_export import ReportExport
from apps.observability.api.serializers.report_export_serializer import ReportExportSerializer

class ReportExportViewSet(viewsets.ModelViewSet):
    queryset = ReportExport.objects.all()
    serializer_class = ReportExportSerializer
    permission_classes = [permissions.IsAuthenticated]

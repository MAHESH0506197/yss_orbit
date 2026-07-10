# yss_orbit\backend\apps\appraisal\api\views\kpi_view.py
from rest_framework import viewsets, permissions
from apps.appraisal.models.kpi import Kpi
from apps.appraisal.api.serializers.kpi_serializer import KpiSerializer

class KpiViewSet(viewsets.ModelViewSet):
    queryset = Kpi.objects.all()
    serializer_class = KpiSerializer
    permission_classes = [permissions.IsAuthenticated]

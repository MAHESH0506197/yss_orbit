# yss_orbit\backend\apps\appraisal\api\serializers\kpi_serializer.py
from rest_framework import serializers
from apps.appraisal.models.kpi import Kpi

class KpiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kpi
        fields = '__all__'

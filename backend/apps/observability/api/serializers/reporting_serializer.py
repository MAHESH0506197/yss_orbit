# yss_orbit\backend\apps\reporting\api\serializers\reporting_serializer.py
from rest_framework import serializers
from apps.observability.models.reporting import Reporting

class ReportingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporting
        fields = '__all__'

# yss_orbit\backend\apps\health\api\serializers\health_serializer.py
from rest_framework import serializers
from apps.observability.models.health_model import SystemHealthLog

class HealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemHealthLog
        fields = '__all__'
        read_only_fields = ['id', 'checked_at']

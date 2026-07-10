# yss_orbit\backend\apps\platform_admin\api\serializers\platform_admin_response_serializer.py
from rest_framework import serializers

class PlatformAdminResponseSerializer(serializers.Serializer):
    """
    Standardized response format for Platform Admin APIs.
    """
    status = serializers.CharField(default='success')
    message = serializers.CharField()
    data = serializers.DictField(required=False)

# yss_orbit\backend\apps\branding\api\serializers\brand_config_serializer.py
from rest_framework import serializers

class BrandingSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)

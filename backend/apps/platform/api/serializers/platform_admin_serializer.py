# yss_orbit\backend\apps\platform_admin\api\serializers\platform_admin_serializer.py
from rest_framework import serializers
from apps.platform.models.platform_admin_model import PlatformAdminProfile

class PlatformAdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAdminProfile
        fields = '__all__'

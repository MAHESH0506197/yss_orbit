# yss_orbit\backend\apps\branding\branding_serializer.py
from rest_framework import serializers

from apps.platform.models.brand_configuration import BrandConfiguration

class BrandConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandConfiguration
        fields = [
            "id",
            "business_unit_id",
            "mode",
            "logo_url",
            "custom_domain",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business_unit_id", "created_at", "updated_at"]

class BrandConfigurationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandConfiguration
        fields = [
            "mode",
            "logo_url",
            "custom_domain",
        ]

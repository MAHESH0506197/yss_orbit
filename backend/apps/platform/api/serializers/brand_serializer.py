from rest_framework import serializers
from apps.platform.models.brand_configuration import BrandConfiguration

class BrandConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandConfiguration
        fields = [
            'id', 'mode', 'logo_url', 
            'custom_domain', 'domain_status', 'ssl_status'
        ]
        read_only_fields = ['id']

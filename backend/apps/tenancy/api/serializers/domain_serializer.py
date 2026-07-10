# yss_orbit\backend\apps\domain\api\serializers\domain_serializer.py
from rest_framework import serializers
from apps.tenancy.models.domain_model import Domain

class DomainSerializer(serializers.ModelSerializer):
    """
    Serializer for the Domain model.
    """
    class Meta:
        model = Domain
        fields = ['id', 'name', 'is_primary', 'is_verified', 'ssl_enabled', 'ssl_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_verified', 'ssl_status', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Domain name is required.")
        # Basic FQDN validation could be added here
        return value.lower()

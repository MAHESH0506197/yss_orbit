# yss_orbit\backend\apps\domain\api\serializers.py
from rest_framework import serializers
from apps.tenancy.models.domain_model import Domain

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'name', 'is_primary', 'is_verified', 'ssl_enabled', 'ssl_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified', 'ssl_status']

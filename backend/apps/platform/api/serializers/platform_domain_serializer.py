import re
from rest_framework import serializers
from apps.platform.models import BrandConfiguration

class PlatformDomainSerializer(serializers.ModelSerializer):
    # Map frontend 'name' to backend 'custom_domain'
    name = serializers.CharField(source='custom_domain')
    # Map frontend 'is_verified' to backend 'domain_status' == 'verified'
    is_verified = serializers.SerializerMethodField()
    # Map frontend 'ssl_enabled' to backend 'ssl_status' == 'active'
    ssl_enabled = serializers.SerializerMethodField()
    
    # We allow setting these statuses from the form/admin
    domain_status = serializers.ChoiceField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('failed', 'Failed')], required=False)
    ssl_status = serializers.ChoiceField(choices=[('pending', 'Pending'), ('active', 'Active'), ('failed', 'Failed')], required=False)
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = BrandConfiguration
        fields = [
            'id', 'business_unit_id', 'organization_id', 'organization_name', 'name', 
            'is_verified', 'ssl_enabled', 'domain_status', 'ssl_status', 
            'created_at', 'updated_at', 'created_by_id', 'updated_by_id'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_id', 'updated_by_id', 'organization_id', 'organization_name']

    def get_is_verified(self, obj):
        return obj.domain_status == 'verified'
        
    def get_ssl_enabled(self, obj):
        return obj.ssl_status == 'active'

    def validate_name(self, value):
        if not value:
            return value
            
        if value != value.lower():
            raise serializers.ValidationError("Domain must be lowercase")
        
        fqdn_regex = re.compile(
            r'^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.(?!-)[a-zA-Z0-9-]{2,63}(?<!-)(\.[a-zA-Z0-9-]{2,63})*$'
        )
        if not fqdn_regex.match(value):
            raise serializers.ValidationError("Domain must be a valid FQDN (e.g., hr.acme.com)")
        
        qs = BrandConfiguration.objects.filter(custom_domain=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Domain must be unique globally")
            
        return value

    def update(self, instance, validated_data):
        if 'custom_domain' in validated_data:
            instance.custom_domain = validated_data.pop('custom_domain')
        
        # Admin can update status
        if 'domain_status' in validated_data:
            instance.domain_status = validated_data.pop('domain_status')
        if 'ssl_status' in validated_data:
            instance.ssl_status = validated_data.pop('ssl_status')
            
        return super().update(instance, validated_data)


# yss_orbit\backend\core\base\base_serializer.py
"""
Base serializer for DRF models.
"""
from rest_framework import serializers

class BaseSerializer(serializers.ModelSerializer):
    """
    Base serializer that provides common read-only fields.
    """
    
    class Meta:
        abstract = True
        
    def build_standard_field(self, field_name, model_field):
        """
        Custom field building logic.
        """
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        
        # Make created_at and updated_at read_only by default
        if field_name in ['created_at', 'updated_at']:
            field_kwargs['read_only'] = True
            
        return field_class, field_kwargs

class BaseTenantSerializer(BaseSerializer):
    """
    Base serializer for tenant models.
    """
    
    def build_standard_field(self, field_name, model_field):
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        
        # Make tenant read_only by default so it's not exposed for editing
        if field_name == 'tenant' or field_name == 'tenant_id':
            field_kwargs['read_only'] = True
            
        return field_class, field_kwargs

from rest_framework import serializers
from apps.iam.models import RbacSubModule, RbacModule

class RbacSubModuleSerializer(serializers.ModelSerializer):
    parent_module_code = serializers.CharField(source='parent_module.code', read_only=True)
    parent_module_id = serializers.PrimaryKeyRelatedField(
        queryset=RbacModule.objects.all(), 
        source='parent_module',
        write_only=True
    )

    class Meta:
        model = RbacSubModule
        fields = [
            'id', 'code', 'parent_module_id', 'parent_module_code', 
            'title', 'description', 'is_active', 'is_deleted', 'deleted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        if RbacSubModule.objects.filter(code=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("A sub-module with this code already exists.")
        return value

from rest_framework import serializers
from apps.iam.models import RbacModule

class RbacModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RbacModule
        fields = [
            'id', 'code', 'title', 'description', 
            'icon', 'is_active', 'is_deleted', 'deleted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        if self.instance and self.instance.code != value:
            # Check if attempting to change code
            pass
        if RbacModule.objects.filter(code=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("A module with this code already exists.")
        return value

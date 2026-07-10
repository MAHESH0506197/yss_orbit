from rest_framework import serializers
from apps.iam.models.rbac_models import RoleTemplate, RoleTemplatePermission, Permission
from apps.iam.api.serializers.permission_serializer import PermissionSerializer

class RoleTemplateSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.filter(is_active=True),
        required=False,
    )

    class Meta:
        model = RoleTemplate
        fields = ["id", "module_code", "name", "description", "permissions", "is_active", "is_deleted", "deleted_at"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        perms = instance.permissions.all()
        rep['permissions'] = PermissionSerializer(perms, many=True).data
        return rep

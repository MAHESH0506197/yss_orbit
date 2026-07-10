# yss_orbit\backend\apps\user_business_unit\api\serializers\user_business_unit_serializer.py
"""
Serializers for the UserBusinessUnit (membership) app.
"""
from rest_framework import serializers
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel


class UserBusinessUnitSerializer(serializers.ModelSerializer):
    """
    Full read serializer — exposes nested user, BU, and role detail.
    """
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_full_name = serializers.SerializerMethodField()
    business_unit_name = serializers.CharField(source="business_unit.name", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True, allow_null=True)

    class Meta:
        model = UserBusinessUnitModel
        fields = [
            "id",
            "user",
            "user_email",
            "user_full_name",
            "business_unit",
            "business_unit_name",
            "role",
            "role_name",
            "is_active_membership",
            "effective_from",
            "effective_to",
            "joined_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "joined_at", "created_at", "updated_at"]

    def get_user_full_name(self, obj) -> str:
        user = obj.user
        return f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()


class UserBusinessUnitCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer — used for create and update operations.
    """
    class Meta:
        model = UserBusinessUnitModel
        fields = [
            "user",
            "business_unit",
            "role",
            "is_active_membership",
            "effective_from",
            "effective_to",
        ]

    def validate(self, attrs):
        # Prevent duplicate active memberships on create
        request = self.context.get("request")
        if self.instance is None:
            user = attrs.get("user")
            bu = attrs.get("business_unit")
            role = attrs.get("role")
            if UserBusinessUnitModel.objects.filter(user=user, business_unit=bu, role=role, is_deleted=False).exists():
                raise serializers.ValidationError(
                    "A membership for this user in this business unit with this role already exists."
                )
        return attrs

class UserBusinessUnitTransferSerializer(serializers.Serializer):
    new_business_unit_id = serializers.UUIDField()
    new_role_id = serializers.UUIDField(required=False, allow_null=True)
    effective_from = serializers.DateTimeField(required=False, allow_null=True)
    effective_to = serializers.DateTimeField(required=False, allow_null=True)

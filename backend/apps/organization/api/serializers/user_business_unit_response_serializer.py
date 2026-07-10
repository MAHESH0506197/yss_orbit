# yss_orbit\backend\apps\user_business_unit\api\serializers\user_business_unit_response_serializer.py
"""
Response serializer — minimal summary for list/embedded views.
"""
from rest_framework import serializers
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel


class UserBusinessUnitResponseSerializer(serializers.ModelSerializer):
    """
    Lightweight membership summary for embedding in user or BU responses.
    """
    user_email = serializers.EmailField(source="user.email", read_only=True)
    business_unit_name = serializers.CharField(source="business_unit.name", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True, allow_null=True)

    class Meta:
        model = UserBusinessUnitModel
        fields = [
            "id",
            "user",
            "user_email",
            "business_unit",
            "business_unit_name",
            "role",
            "role_name",
            "is_active_membership",
            "joined_at",
        ]
        read_only_fields = ["id", "joined_at"]

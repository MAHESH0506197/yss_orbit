# yss_orbit\backend\apps\rbac\api\serializers\user_role_serializer.py
"""
YSS Orbit — UserRole Serializer

FIX-BUG35: No API endpoint for UserRole existed — this is "user-RBAC
mapping" (IMPLEMENTATION_PLAN.md item 2). UserRole is THE table that
RBACService.get_user_permissions_as_frozenset() reads via
UserRoleRepository.get_active_for_user_in_bu(). Without an API for it,
the only way to inspect/manage permission grants directly was via the
Django admin (which itself wasn't wired) or seed_enterprise.py
(manual dev tool).

UserRole(models.Model) fields:
  id, user_id, business_unit_id, role (FK), is_active,
  assigned_by_id, assigned_at, revoked_at

NOT a BaseModel/TenantModel, so no is_deleted/audit field set from base.
Write contract:
  - user_id, business_unit_id, role_id (all required for create)
  - Write via UserRoleViewSet.create → RoleAssignmentService.sync_user_role()
    (the view handles the DB write, not the serializer.save() path — this
    prevents DRF's auto-save from bypassing sync_user_role's
    revoke-then-assign logic for the UniqueConstraint on active roles)
"""
from __future__ import annotations

from rest_framework import serializers
from apps.iam.models.rbac_models import UserRole, Role


class UserRoleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_type = serializers.CharField(source="role.role_type", read_only=True)

    class Meta:
        model = UserRole
        fields = [
            "id", "user_id", "business_unit_id",
            "role_id", "role_name", "role_type",
            "is_active", "assigned_by_id", "assigned_at", "revoked_at",
        ]
        read_only_fields = fields


class UserRoleSerializer(serializers.ModelSerializer):
    """
    Full serializer for create/retrieve.
    On write: validate role exists and is active for this business_unit_id.
    The view calls RoleAssignmentService.sync_user_role() after validation —
    DO NOT call .save() on this serializer directly.
    """
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_type = serializers.CharField(source="role.role_type", read_only=True)

    # Write fields
    user_id = serializers.UUIDField()
    business_unit_id = serializers.UUIDField()
    role_id = serializers.UUIDField()

    class Meta:
        model = UserRole
        fields = [
            "id", "user_id", "business_unit_id",
            "role_id", "role_name", "role_type",
            "is_active", "assigned_by_id", "assigned_at", "revoked_at",
        ]
        read_only_fields = [
            "id", "role_name", "role_type", "is_active",
            "assigned_by_id", "assigned_at", "revoked_at",
        ]

    def validate(self, data: dict) -> dict:
        """
        Validate that the role exists, belongs to (or is accessible for)
        the given business_unit_id, and is not archived.
        """
        role_id = data.get("role_id")
        business_unit_id = data.get("business_unit_id")

        if role_id and business_unit_id:
            try:
                role = Role.objects.get(pk=role_id, is_deleted=False)
            except Role.DoesNotExist:
                raise serializers.ValidationError({
                    "role_id": f"Role '{role_id}' not found or archived."
                })
            if not role.is_active:
                raise serializers.ValidationError({
                    "role_id": f"Role '{role.name}' is inactive and cannot be assigned."
                })
            
            # Roles must belong to the Business Unit
            if str(role.business_unit_id) != str(business_unit_id):
                raise serializers.ValidationError({
                    "role_id": (
                        f"Role '{role.name}' belongs to Business Unit {role.business_unit_id}, "
                        f"but the specified Business Unit is {business_unit_id}."
                    )
                })

        return data

# apps/rbac/api/serializers/role_serializer.py
# FIX-BUG16 (CRITICAL): Both RoleSerializer and PermissionSerializer used
# `fields = '__all__'` with `read_only_fields = [..., 'tenant_id']`.
#
# Problem 1: 'tenant_id' does not exist on Role (TenantModel provides
# `business_unit_id`, not `tenant_id`). DRF's ModelSerializer raises an
# AssertionError ("field 'tenant_id' ... not included in 'fields'" /
# "non-existent field") at class-definition time — meaning ANY import of
# this serializer crashes. Since RoleViewSet imports it at module load,
# /api/v1/roles/ was completely unreachable (500 on every request).
#
# Problem 2: Role.permissions is a ManyToManyField with `through="RolePermission"`.
# `fields = '__all__'` lets DRF auto-generate a default PrimaryKeyRelatedField
# for `permissions`, but ModelSerializer.create()/update() then attempts
# `instance.permissions.set(value)` — which Django REFUSES for M2M fields
# with a custom `through` model ("Cannot set values on a ManyToManyField
# which specifies an intermediary model").
#
# FIX (this file): explicit `fields` list using real model fields
# (business_unit_id, not tenant_id). `permissions` is DECLARED EXPLICITLY as
# PrimaryKeyRelatedField(many=True) — DRF allows this declaration (it's only
# the IMPLICIT '__all__' auto-save path that's blocked). The serializer never
# calls .save() on the M2M itself: RoleViewSet.create()/update() pop
# `permissions` out of validated_data and sync RolePermission rows manually
# (see role_view.py::_sync_role_permissions), which is the only Django-
# sanctioned way to write a through-M2M.
#
# Field naming matches the LIVE frontend contract (pages/roles/types/roleTypes.ts,
# RoleFormModal.tsx): `permissions: string[]` is a list of Permission UUIDs
# (frontend's usePermissions() returns Permission objects with `.id` UUIDs;
# RoleFormModal.togglePermission(p.id) pushes UUIDs into this array) — NOT
# permission codes. B07 §5.2's code-based identity is preserved at the DB
# layer via RolePermission.permission_id (FK to Permission.id); codes remain
# the source of truth for HasRBACPermission checks (Role.get_permission_codes()).
from __future__ import annotations

from rest_framework import serializers
from apps.iam.models.rbac_models import Role, Permission

# Fields shared by both serializers — real model fields only, NO 'tenant_id'.
_BASE_FIELDS = [
    "id",
    "business_unit_id",
    "name",
    "description",
    "department_name",
    "module_code",
    "role_type",
    "is_default",
    "is_active",
    "is_deleted",
    "source_template_id",
    "source_template_name",
    "created_at",
    "updated_at",
    "created_by_id",
    "updated_by_id",
    "deleted_at",
    "deleted_by_id",
]
_BASE_READ_ONLY = [
    "id",
    "source_template_id",
    "source_template_name",
    "created_at",
    "updated_at",
    "deleted_at",
    "deleted_by_id",
    "created_by_id",
    "updated_by_id",
]


def _validate_role_type(value: str) -> str:
    """
    B07: SYSTEM roles (OWNER/ADMIN/MANAGER/STAFF) cannot be created or
    re-typed via the API — they are seeded by sync_rbac. Custom roles only.
    """
    if value == Role.RoleType.SYSTEM:
        raise serializers.ValidationError(
            "SYSTEM roles cannot be created or modified via the API. "
            "They are seeded by the platform (apps.iam.management.commands.sync_rbac)."
        )
    return value


class RoleListSerializer(serializers.ModelSerializer):
    """
    Lightweight Role serializer for list views.

    Includes `permissions` (list[UUID]) since RolesPage.tsx's table column
    reads `role.permissions.length` / `.slice(0, 2)` directly from list
    results — omitting it would break the Permissions column on every row.
    Uses `prefetch_related('permissions')` (set in RoleViewSet.get_queryset)
    so this does NOT cause N+1 queries despite being on every list row.
    """

    permissions = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True,
        help_text="List of assigned Permission UUIDs (read-only in list view).",
    )
    # Expose source template FK id and human-readable name (null for system/scratch roles).
    source_template_id = serializers.UUIDField(
        source="source_template.id", read_only=True, allow_null=True
    )
    source_template_name = serializers.CharField(
        source="source_template.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Role
        fields = _BASE_FIELDS + ["permissions"]
        read_only_fields = _BASE_READ_ONLY


class RoleSerializer(serializers.ModelSerializer):
    """
    Full Role serializer for create/update/retrieve.

    FIX-BUG16: 'business_unit_id' (real TenantModel field) replaces the
    non-existent 'tenant_id'.

    `permissions`: list[UUID] of Permission primary keys — matches
    RoleFormModal's payload shape exactly (`permissions: string[]` of
    `p.id`). Writable via PrimaryKeyRelatedField, but RoleViewSet pops this
    out of validated_data before calling Role(**validated) / setattr loop,
    and instead syncs RolePermission rows explicitly
    (_sync_role_permissions) — the only way Django permits writing a
    through-M2M. See module docstring for the full Django constraint.

    `source_template_id` / `source_template_name`: read-only fields that
    expose the originating RoleTemplate. Null for SYSTEM roles and roles
    created from scratch. Set by RoleTemplateViewSet.apply_to_bu() action.
    """

    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.filter(is_active=True),
        required=False,
        help_text="List of Permission UUIDs to assign to this role (replaces existing assignments).",
    )
    # Read-only template lineage fields
    source_template_id = serializers.UUIDField(
        source="source_template.id", read_only=True, allow_null=True
    )
    source_template_name = serializers.CharField(
        source="source_template.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Role
        fields = _BASE_FIELDS + ["permissions"]
        read_only_fields = _BASE_READ_ONLY

    def validate_role_type(self, value: str) -> str:
        return _validate_role_type(value)

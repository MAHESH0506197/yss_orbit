# apps/rbac/api/serializers/permission_serializer.py
# FIX-BUG16 (CRITICAL): `fields = '__all__'` with
# `read_only_fields = ['id', 'created_at', 'updated_at', 'tenant_id']`.
#
# Permission(models.Model) — NOT a BaseModel/TenantModel — has fields:
#   id, code, name, description, module, is_active, created_at
# It has NO `updated_at` and NO `tenant_id`. DRF's ModelSerializer raises
# an AssertionError at class-definition time for BOTH non-existent fields
# ("field 'updated_at'/'tenant_id' ... not included in 'fields'"), so
# importing this serializer crashed — /api/v1/permissions/ was completely
# unreachable (500 on every request, since PermissionViewSet imports it
# at module load).
#
# Permission is described as "Immutable permission registry. Seeded from
# code — not user-editable." (see models.py docstring), so this serializer
# is READ-ONLY: no create/update endpoints are exposed for it
# (PermissionViewSet should be a ReadOnlyModelViewSet — see FIX notes in
# permission_view.py).
from __future__ import annotations

from rest_framework import serializers
from apps.iam.models import Permission


class PermissionSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the immutable Permission registry.

    FIX-BUG16: removed non-existent 'updated_at' and 'tenant_id' fields.
    Permission has only: id, code, name, description, module, is_active,
    created_at (see apps/rbac/models.py — Permission(models.Model), not
    BaseModel/TenantModel).
    """

    class Meta:
        model = Permission
        fields = [
            "id",
            "code",
            "name",
            "description",
            "module",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields  # Immutable registry — entire serializer is read-only

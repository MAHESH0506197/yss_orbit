# yss_orbit\backend\apps\business_unit\api\serializers\business_unit_module_serializer.py
"""
YSS Orbit — BusinessUnitModule Serializers

Implements the API contract for items 3 & 4 of the 4-area request
("business unit module subscription" and "business unit module access
management"). BusinessUnitModule (apps.organization.models) is the
CANONICAL module-tracking model — it's the one
ModuleSubscriptionMiddleware._check_module_access() reads (see BUG-38 in
IMPLEMENTATION_PLAN.md for why this is canonical over apps.tenancy).

Two serializers, following the List/Full split pattern from
role_serializer.py (RoleListSerializer/RoleSerializer):

  - PlatformModuleSerializer: read-only, exposes the global module registry
    (apps.tenancy.models.PlatformModule) — used standalone for "show
    me all 18 modules with their dependency info" and nested inside
    BusinessUnitModuleSerializer.

  - BusinessUnitModuleSerializer: the per-BU subscription/activation record.
    `module` is nested-read (full PlatformModule detail) but
    write-accepts `module_code` (a PlatformModule.code string) — mirrors
    how RoleSerializer accepts `permissions` (PKs) while exposing richer
    read data; here we use the human-readable `code` instead of a raw PK
    since module codes are the stable, catalogue-defined identifiers
    (E04 §3.1) that the frontend / dependency validator / middleware all
    key on — using a PK would require the frontend to look up PKs first.
"""
from __future__ import annotations

from rest_framework import serializers

from apps.tenancy.models import PlatformModule
from apps.organization.models import BusinessUnitModule
from apps.platform.seed.seed_modules import MODULE_DEPENDENCIES


class PlatformModuleSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the global PlatformModule registry.
    Includes `depends_on` (from MODULE_DEPENDENCIES, NOT a DB field — the
    dependency graph is defined once in seed_modules.py and consumed here
    for the frontend to render "requires: X, Y" without a second request).
    """

    depends_on = serializers.SerializerMethodField()

    class Meta:
        model = PlatformModule
        fields = [
            "id", "code", "name", "description", "category", "icon",
            "is_active", "is_free", "sort_order", "depends_on",
        ]
        read_only_fields = fields

    def get_depends_on(self, obj: PlatformModule) -> list[str]:
        return MODULE_DEPENDENCIES.get(obj.code, [])


class BusinessUnitModuleListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views — nests PlatformModule detail
    (module code/name/category/depends_on) via select_related (set in
    BusinessUnitModuleViewSet.get_queryset), avoiding N+1.
    """

    module = PlatformModuleSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = BusinessUnitModule
        fields = [
            "id", "business_unit_id", "module", "status", "is_active",
            "plan_limit", "trial_ends_at", "activated_at", "expires_at",
            "activated_by_id",
        ]
        read_only_fields = fields


class BusinessUnitModuleSerializer(serializers.ModelSerializer):
    """
    Full serializer for retrieve/create/update.

    Write contract: `module_code` (write-only, validated against
    PlatformModule.objects.filter(is_active=True)) — the view resolves this
    to `module` (FK) before saving. `module` itself (nested detail) and
    `is_active` (computed property) are read-only.

    `status`, `plan_limit`, `trial_ends_at`, `expires_at` are writable —
    these are the fields BusinessUnitModuleViewSet.activate/deactivate/
    suspend/set_plan_limit actions mutate. Direct PATCH of `status` is also
    permitted for flexibility, but the dedicated actions are preferred
    since they run dependency validation (module_dependency_validator) —
    a raw PATCH to status=ACTIVE does NOT run dependency checks, matching
    how RoleViewSet's raw PATCH doesn't re-run permission-sync side effects
    that its dedicated paths do. (Documented as a tracked UX note: the
    frontend should always use the activate/deactivate/suspend actions.)
    """

    module = PlatformModuleSerializer(read_only=True)
    module_code = serializers.SlugRelatedField(
        slug_field="code",
        queryset=PlatformModule.objects.filter(is_active=True),
        write_only=True,
        source="module",
    )
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = BusinessUnitModule
        fields = [
            "id", "business_unit_id", "module", "module_code", "status",
            "is_active", "plan_limit", "trial_ends_at", "activated_at",
            "expires_at", "activated_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
        ]
        read_only_fields = [
            "id", "module", "is_active", "activated_at", "activated_by_id",
            "created_at", "updated_at", "created_by_id", "updated_by_id",
        ]

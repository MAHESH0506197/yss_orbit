# apps/rbac/api/views/permission_view.py
"""
YSS Orbit — Permission ViewSet
B07 §5.3: All protected endpoints MUST have permission checks. Deny by default.
B07 §7: Missing permission check = CRITICAL violation.
L3 fix: Permission is a GLOBAL/platform entity — it has NO tenant scope.
  No business_unit_id filter applies here.

FIX-BUG16: serializer_class now points at the fixed PermissionSerializer
(no more crashing 'updated_at'/'tenant_id' fields that don't exist on
Permission(models.Model)).

FIX (new): viewsets.ModelViewSet → ReadOnlyModelViewSet. The class's own
docstring and Permission's own model docstring both say "Immutable
permission registry... not user-editable" / "Seeded from code" — yet the
ModelViewSet exposed POST/PUT/PATCH/DELETE on /api/v1/permissions/, which
would have let any user with rbac.permission.create silently mutate the
seeded registry (bypassing sync_rbac as the source of truth, per B07 §5.18
"Add to the permission group in B07 §5.18 permission catalogue" — i.e. the
catalogue is code, not API-writable data).

Added: `module` filter + `modules` action for frontend permission-matrix
grouping (PermissionMatrix.tsx groups permissions by module).
"""
from __future__ import annotations

import logging

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from core.responses import SuccessResponse
from core.responses.paginated_response import StandardPagination
from core.permissions.rbac_permission import HasRBACPermission
from apps.iam.models import Permission
from apps.iam.api.serializers.permission_serializer import PermissionSerializer

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List permissions (immutable registry)",
        parameters=[
            OpenApiParameter("search",    str,  description="Search by code, name, or description"),
            OpenApiParameter("module",    str,  description="Filter by module, e.g. 'organization', 'rbac'"),
            OpenApiParameter("is_active", bool, description="Filter by active status"),
            OpenApiParameter("page",      int,  description="Page number"),
            OpenApiParameter("page_size", int,  description="Records per page"),
        ],
    ),
    retrieve=extend_schema(summary="Get single permission"),
)
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Enterprise-grade ViewSet for the Permission registry.
    RBAC-enforced: requires IsAuthenticated + RBAC permission check.

    FIX: ModelViewSet → ReadOnlyModelViewSet. Permission is an immutable,
    code-seeded registry (apps.iam.management.commands.sync_rbac is the
    only writer). Exposing create/update/delete here would let API clients
    silently diverge the DB registry from the B07 §5.18 permission
    catalogue defined in code.

    Permission is a GLOBAL/platform entity (B02 data classification):
      - It does NOT belong to any BusinessUnit
      - No tenant filtering applies
      - Visible to any authenticated user holding rbac.permission.view
        (needed to render the permission matrix when building custom roles)

    Required permissions (B07 §5.16 taxonomy):
      - List/Retrieve: rbac.permission.view
    """
    serializer_class   = PermissionSerializer
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["rbac.permission.view"]
    pagination_class   = None

    def get_queryset(self):
        """
        Returns permissions — Permission is a GLOBAL entity, no BU scoping.
        L3 fix: Removed dead tenant_id filter. Permission has no business_unit_id.
        B07 §5.17: Active permissions only by default; ?is_active=false to audit deprecated ones.
        """
        p = self.request.query_params
        qs = Permission.objects.all()

        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        else:
            # Default: active only. Pass ?is_active=false explicitly for the
            # full audit view of deprecated permission codes.
            qs = qs.filter(is_active=True)

        module = p.get("module")
        if module:
            qs = qs.filter(module=module)

        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(code__icontains=search) | Q(name__icontains=search) | Q(description__icontains=search)
            )

        return qs.order_by("module", "code")

    @extend_schema(summary="List distinct permission modules (for permission-matrix grouping)")
    @action(detail=False, methods=["get"], url_path="modules")
    def modules(self, request: Request, *args, **kwargs) -> Response:
        """
        Returns the distinct list of `module` values across active
        permissions, e.g. ["organization", "business_unit", "business_domain",
        "rbac", "iam", ...]. Used by the frontend PermissionMatrix to render
        one section per module without hardcoding the module list.
        """
        modules = list(
            Permission.objects
            .filter(is_active=True)
            .order_by("module")
            .values_list("module", flat=True)
            .distinct()
        )
        return SuccessResponse(data=modules)

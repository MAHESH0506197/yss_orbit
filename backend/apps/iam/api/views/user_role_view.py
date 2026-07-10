# yss_orbit\backend\apps\rbac\api\views\user_role_view.py
"""
YSS Orbit — UserRole ViewSet
"User-RBAC Mapping" — IMPLEMENTATION_PLAN.md item 2

FIX-BUG35 (CRITICAL): No API endpoint existed for UserRole at all — zero
CRUD for the rbac_user_roles table. UserRole is the actual permission-
granting record that RBACService.get_user_permissions_as_frozenset() reads.
Without an endpoint, the only way to assign permissions directly (as
distinct from assigning a role via User-BU membership) was via seed_enterprise
or the Django admin (also unregistered until BUG admin fix). This is a
first-class, public API surface matching the "IAM" section of the platform.

Note on relationship with UserBusinessUnitViewSet:
  - UserBusinessUnitViewSet.create/update + user_business_unit_service
    (FIX-BUG36) NOW automatically sync UserRole rows when a BU membership
    is created/updated with a role_id. This is the PRIMARY write path.
  - UserRoleViewSet is the SECONDARY, direct write path — for cases where:
    (a) an admin needs to view all current role assignments across a BU,
    (b) override an assignment independently of membership management,
    (c) audit revocation history (revoked roles are preserved as
        is_active=False rows, visible here unlike in UserBusinessUnitView).

All writes go through RoleAssignmentService.sync_user_role() — the
same service the UBU path calls, ensuring consistent
constraint-handling and cache invalidation for both paths.

Required permissions (added to sync_rbac.py PERMISSION_CATALOGUE):
  rbac.userrole.view    — list/retrieve
  rbac.userrole.create  — create (assign a role)
  rbac.userrole.delete  — revoke (destroy = set is_active=False)
  rbac.userrole.restore — re-activate a revoked assignment
"""
from __future__ import annotations

import logging

from django.db.models import QuerySet
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse
from core.permissions.rbac_permission import HasRBACPermission
from apps.iam.models.rbac_models import UserRole
from apps.iam.api.serializers.user_role_serializer import UserRoleSerializer, UserRoleListSerializer
from apps.iam.services.role_assignment_service import RoleAssignmentService

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="List UserRole assignments (user-RBAC mapping)",
        parameters=[
            OpenApiParameter("business_unit_id", str, description="Filter by BU UUID"),
            OpenApiParameter("user_id", str, description="Filter by user UUID"),
            OpenApiParameter("is_active", bool, description="Filter by active status (default: true)"),
        ],
    ),
    retrieve=extend_schema(summary="Get a single UserRole assignment"),
)
class UserRoleViewSet(BaseViewSet):
    """
    /api/v1/user-roles/
    CRUD for UserRole — the actual permission-granting row RBACService reads.

    CAUTION: URL registration must avoid BUG-20-style double-prefix.
    apps/rbac/api/urls.py registers this at r"user-roles", giving
    /api/v1/user-roles/ (since config/urls.py mounts apps.iam.api.urls
    at "" after the BUG-20 fix, not "roles/").
    """
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["rbac.userrole.view"]

    WRITE_PERMISSIONS = {
        "create":  ["rbac.userrole.create"],
        "destroy": ["rbac.userrole.delete"],
        "restore": ["rbac.userrole.restore"],
    }

    def get_serializer_class(self):
        if self.action == "list":
            return UserRoleListSerializer
        return UserRoleSerializer

    def check_write_permission(self) -> None:
        required = self.WRITE_PERMISSIONS.get(self.action, [])
        if not required:
            return
        if getattr(self.request.user, "is_super_admin", False):
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No security context.")
        for perm in required:
            if perm not in sc.permissions:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(f"Missing permission: '{perm}'.")

    def get_queryset(self) -> QuerySet:
        p = self.request.query_params
        qs = UserRole.objects.select_related("role").all()

        bu_id = p.get("business_unit_id")
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)

        user_id = p.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        # Default: active only. Pass ?is_active=false to see revoked history.
        is_active = p.get("is_active", "true")
        qs = qs.filter(is_active=is_active.lower() != "false")

        return qs.order_by("-assigned_at")

    def create(self, request: Request, *args, **kwargs) -> Response:
        """
        Assign a role to a user within a business unit.
        If the user already has an active role in this BU, it is revoked
        first (one-active-role-per-BU constraint enforced by
        RoleAssignmentService.sync_user_role — no 409 Conflict is raised;
        the old role is replaced). This mirrors the UBU service's create
        behaviour (role REASSIGNMENT semantics).
        """
        self.check_write_permission()
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        actor_id = getattr(request.user, "id", None)
        new_user_role = RoleAssignmentService.sync_user_role(
            user_id=vd["user_id"],
            business_unit_id=vd["business_unit_id"],
            new_role_id=vd["role_id"],
            actor_user_id=actor_id,
        )

        return CreatedResponse(
            data=UserRoleSerializer(new_user_role, context={"request": request}).data,
            message="Role assigned successfully.",
        )

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Revoke a role assignment (sets is_active=False, revoked_at=now).
        The UserRole row is preserved for audit — not deleted from the DB.
        B01: hard delete is PROHIBITED for business data.
        """
        self.check_write_permission()
        instance = self.get_object()

        if not instance.is_active:
            return Response(
                {"detail": "This role assignment is already revoked."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_active = False
        instance.revoked_at = timezone.now()
        instance.save(update_fields=["is_active", "revoked_at"])

        # Invalidate RBAC cache for this user+BU pair.
        from apps.iam.services.rbac_service import RBACService
        RBACService.invalidate_user_permissions(instance.user_id, instance.business_unit_id)

        return SuccessResponse(
            data=UserRoleSerializer(instance, context={"request": request}).data,
            message="Role assignment revoked successfully.",
        )

    @extend_schema(summary="Re-activate a previously revoked UserRole assignment")
    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request: Request, *args, **kwargs) -> Response:
        """
        Re-activates a revoked UserRole. Fails if the user already has
        a DIFFERENT active role in this BU (unique_active_role_per_user_per_bu
        constraint) — revoke that one first, or use create (which
        auto-revokes the old role before assigning the new one).
        """
        self.check_write_permission()
        try:
            instance = UserRole.objects.get(pk=kwargs.get("pk"), is_active=False)
        except UserRole.DoesNotExist:
            return Response(
                {"detail": "Assignment not found or already active."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check the unique constraint won't be violated.
        conflict = UserRole.objects.filter(
            user_id=instance.user_id,
            business_unit_id=instance.business_unit_id,
            is_active=True,
        ).exclude(pk=instance.pk).exists()

        if conflict:
            return Response(
                {"detail": (
                    "This user already has an active role assignment in this Business Unit. "
                    "Revoke it first via DELETE /user-roles/{id}/, then restore this one."
                )},
                status=status.HTTP_409_CONFLICT,
            )

        instance.is_active = True
        instance.revoked_at = None
        instance.save(update_fields=["is_active", "revoked_at"])

        from apps.iam.services.rbac_service import RBACService
        RBACService.invalidate_user_permissions(instance.user_id, instance.business_unit_id)

        return SuccessResponse(
            data=UserRoleSerializer(instance, context={"request": request}).data,
            message="Role assignment restored successfully.",
        )

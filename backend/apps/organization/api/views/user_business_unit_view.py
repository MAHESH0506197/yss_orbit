# yss_orbit\backend\apps\user_business_unit\api\views\user_business_unit_view.py
"""
YSS Orbit — UserBusinessUnit ViewSet
Full CRUD for User-BU memberships.

FIX-BUG34 (HIGH): permission_classes was [IsAuthenticated] only — no
HasRBACPermission, no required_permissions. Any authenticated user could
create/update/delete/activate/deactivate ANY user's BU memberships, including
granting themselves membership+role in another Business Unit. B07 §5.3:
ALL protected endpoints MUST have RBAC checks. Deny by default.

New permission codes (added to sync_rbac.py PERMISSION_CATALOGUE):
  users.userbu.view    — list/retrieve
  users.userbu.create  — create
  users.userbu.update  — update/partial_update
  users.userbu.delete  — destroy
  users.userbu.restore — activate (restore a deactivated membership)

Assigned in ROLE_PERMISSION_TIERS: OWNER/ADMIN get all 5; MANAGER gets
view+create+update+restore (can manage memberships on their BU but not
delete/hard-archive); STAFF gets view only.
"""
from __future__ import annotations

import logging
import uuid

from django.db.models import Q, QuerySet
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

try:
    from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
    HAS_SPECTACULAR = True
except ImportError:
    HAS_SPECTACULAR = False

from core.base.base_viewset import BaseViewSet
from core.responses import SuccessResponse, CreatedResponse, NoContentResponse
from core.permissions.rbac_permission import HasRBACPermission

from apps.organization.models.user_business_unit_model import UserBusinessUnitModel
from apps.organization.api.serializers.user_business_unit_serializer import (
    UserBusinessUnitSerializer,
    UserBusinessUnitCreateUpdateSerializer,
    UserBusinessUnitTransferSerializer,
)
from apps.organization.services.user_business_unit_service import UserBusinessUnitService

logger = logging.getLogger(__name__)


class UserBusinessUnitViewSet(BaseViewSet):
    """
    /api/v1/user-bu-mapping/memberships/
    Full CRUD + activate/deactivate for User-Business-Unit memberships.

    FIX-BUG34: RBAC-enforced. required_permissions gates ALL actions at
    the ViewSet level (HasRBACPermission.has_permission runs before every
    action). Per-action escalation via check_write_permission() for write
    operations, matching BusinessDomainViewSet/RoleViewSet's established
    pattern.
    """
    # FIX-BUG34: was [IsAuthenticated] only.
    permission_classes = [IsAuthenticated, HasRBACPermission]
    required_permissions = ["users.userbu.view"]

    WRITE_PERMISSIONS = {
        "create":         ["users.userbu.create"],
        "update":         ["users.userbu.update"],
        "partial_update": ["users.userbu.update"],
        "destroy":        ["users.userbu.delete"],
        "activate":       ["users.userbu.restore"],
        "deactivate":     ["users.userbu.update"],
        "transfer":       ["users.userbu.create", "users.userbu.delete"],
    }

    service = UserBusinessUnitService()

    ALLOWED_ORDERINGS = {
        "joined_at", "-joined_at",
        "created_at", "-created_at",
    }

    def check_write_permission(self) -> None:
        """Gate write operations on top of the base 'view' permission."""
        required = self.WRITE_PERMISSIONS.get(self.action, [])
        if not required:
            return
        if getattr(self.request.user, "is_super_admin", False):
            return
        sc = getattr(self.request, "security_context", None)
        if sc is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No security context. Ensure you are authenticated.")
        for perm in required:
            if perm not in sc.permissions:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"You do not have the '{perm}' permission required for this action."
                )

    # ── Serializer routing ────────────────────────────────────────────────────

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return UserBusinessUnitCreateUpdateSerializer
        return UserBusinessUnitSerializer

    # ── Queryset + filtering ──────────────────────────────────────────────────

    def get_queryset(self) -> QuerySet:
        p = self.request.query_params
        qs = UserBusinessUnitModel.objects.select_related(
            "user", "business_unit", "role"
        ).all()

        # Filter by user
        user_id = p.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        # Filter by business unit
        business_unit_id = p.get("business_unit_id")
        if business_unit_id:
            qs = qs.filter(business_unit_id=business_unit_id)

        # Filter by active status
        is_active = p.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active_membership=is_active.lower() == "true")

        # Search by user email or BU name
        search = p.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(business_unit__name__icontains=search)
            )

        # Ordering
        ordering = p.get("ordering", "-joined_at")
        if ordering in self.ALLOWED_ORDERINGS:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-joined_at")

        return qs

    # ── List with stats ───────────────────────────────────────────────────────

    def list(self, request: Request, *args, **kwargs) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        # FIX-BUG-UBU-STATS: Previously used UserBusinessUnitModel.objects (unscoped),
        # which returned platform-wide counts regardless of which tenant / BU the
        # requesting user belongs to — a cross-tenant data leak.
        # Now use the already-filtered queryset (scoped by user_id, business_unit_id,
        # search, is_active) as the base for aggregated stats so the numbers match
        # the data the user actually sees.
        base_qs = queryset
        stats = {
            "total":         base_qs.count(),
            "total_active":  base_qs.filter(is_active_membership=True).count(),
            "total_inactive": base_qs.filter(is_active_membership=False).count(),
        }

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated = self.get_paginated_response(serializer.data)
            meta = paginated.data.get("meta", {})
            meta.update(stats)
            paginated.data["meta"] = meta
            return paginated

        serializer = self.get_serializer(queryset, many=True)
        return SuccessResponse(data=serializer.data, meta=stats)

    # ── Create ────────────────────────────────────────────────────────────────

    def create(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            membership = self.service.create_membership(
                security_context=request.security_context,
                user_id=vd["user"].id,
                business_unit_id=vd["business_unit"].id,
                role_id=vd.get("role").id if vd.get("role") else None,
                effective_from=vd.get("effective_from"),
                effective_to=vd.get("effective_to"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.ROLE_ASSIGNED,
            resource_type="user_business_unit.UserBusinessUnitModel",
            user_id=vd["user"].id,
            user_username=vd["user"].username,
            resource_id=membership.id,
            resource_display=f"{vd['user'].username} in {vd['business_unit'].name}",
            new_values=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return CreatedResponse(
            data=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            message="Membership created successfully.",
        )

    # ── Update ────────────────────────────────────────────────────────────────

    def update(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        update_data = {}
        if "role" in vd:
            update_data["role_id"] = vd["role"].id if vd["role"] else None
        if "is_active_membership" in vd:
            update_data["is_active_membership"] = vd["is_active_membership"]
        if "effective_from" in vd:
            update_data["effective_from"] = vd["effective_from"]
        if "effective_to" in vd:
            update_data["effective_to"] = vd["effective_to"]

        try:
            membership = self.service.update_membership(
                security_context=request.security_context,
                membership_id=instance.id,
                data=update_data,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.UPDATE,
            resource_type="user_business_unit.UserBusinessUnitModel",
            user_id=instance.user_id,
            user_username=instance.user.username,
            resource_id=membership.id,
            resource_display=f"{instance.user.username} in {instance.business_unit.name}",
            new_values=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return SuccessResponse(
            data=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            message="Membership updated successfully.",
        )

    # ── Delete ────────────────────────────────────────────────────────────────

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        self.check_write_permission()
        instance = self.get_object()
        try:
            self.service.delete_membership(
                security_context=request.security_context,
                membership_id=instance.id,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

        from apps.compliance.services.audit_service import log_action, AuditLog
        from core.utils.ip_utils import get_client_ip
        log_action(
            action=AuditLog.Action.PERMISSION_REVOKED,
            resource_type="user_business_unit.UserBusinessUnitModel",
            user_id=instance.user_id,
            user_username=instance.user.username,
            resource_id=instance.id,
            resource_display=f"{instance.user.username} removed from {instance.business_unit.name}",
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return NoContentResponse(message="Membership deleted successfully.")

    # ── Custom: Deactivate ────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request: Request, *args, **kwargs) -> Response:
        """Deactivate a membership without deleting the record."""
        self.check_write_permission()
        instance = self.get_object()
        try:
            membership = self.service.deactivate_membership(
                security_context=request.security_context,
                membership_id=instance.id,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return SuccessResponse(
            data=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            message="Membership deactivated.",
        )

    # ── Custom: Activate ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request: Request, *args, **kwargs) -> Response:
        """Re-activate a deactivated membership."""
        self.check_write_permission()
        instance = self.get_object()
        try:
            membership = self.service.activate_membership(
                security_context=request.security_context,
                membership_id=instance.id,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return SuccessResponse(
            data=UserBusinessUnitSerializer(membership, context={"request": request}).data,
            message="Membership activated.",
        )

    # ── Custom: Transfer ──────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="transfer")
    def transfer(self, request: Request, *args, **kwargs) -> Response:
        """Transfer user from this BU assignment to a new one."""
        self.check_write_permission()
        instance = self.get_object()
        
        serializer = UserBusinessUnitTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        try:
            new_membership = self.service.transfer_membership(
                security_context=request.security_context,
                membership_id=instance.id,
                new_business_unit_id=vd["new_business_unit_id"],
                new_role_id=vd.get("new_role_id"),
                effective_from=vd.get("effective_from"),
                effective_to=vd.get("effective_to"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return SuccessResponse(
            data=UserBusinessUnitSerializer(new_membership, context={"request": request}).data,
            message="Membership transferred successfully.",
        )

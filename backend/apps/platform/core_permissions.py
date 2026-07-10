# yss_orbit\backend\apps\core\permissions.py
"""
YSS Orbit — Core DRF Permissions
Checks SecurityContext for auth and RBAC, never uses Django's built-in permission system.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.iam.security_context import SecurityContext


def _get_ctx(request: Request) -> SecurityContext | None:
    return getattr(request, "security_context", None)


class IsAuthenticated(BasePermission):
    """Requires valid JWT cookie → SecurityContext present."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        ctx = _get_ctx(request)
        return ctx is not None and request.user and request.user.is_authenticated


class IsSuperAdmin(BasePermission):
    """Only platform super-admins."""

    def has_permission(self, request: Request, view: APIView) -> bool:
        ctx = _get_ctx(request)
        return ctx is not None and ctx.is_super_admin


class RequiresPermission(BasePermission):
    """
    Checks a specific permission code from SecurityContext.

    Usage in view:
        permission_classes = [IsAuthenticated, RequiresPermission]
        required_permission = "inventory.items.create"
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        ctx = _get_ctx(request)
        if ctx is None:
            return False

        permission_code = getattr(view, "required_permission", None)
        if not permission_code:
            return True  # No specific permission required

        return ctx.has_permission(permission_code)


class IsTenantMember(BasePermission):
    """
    Validates user is a member of the X-Business-Unit-Id.
    Requires TenantMiddleware to have run first.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        ctx = _get_ctx(request)
        if ctx is None:
            return False

        bu_id = getattr(request, "business_unit_id", None)
        if bu_id is None:
            return False

        # Super admins bypass membership check
        if ctx.is_super_admin:
            return True

        # Verify context has matching BU
        return ctx.business_unit_id is not None and str(ctx.business_unit_id) == str(bu_id)

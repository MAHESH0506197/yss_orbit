# yss_orbit\backend\core\permissions\rbac_permission.py
"""
YSS Orbit - RBAC Permission
Implements Role-Based Access Control logic for DRF views.

FIX-BUG13 (CRITICAL): has_permission() previously read
    getattr(request.auth, "permissions", getattr(request.user, "permissions", []))
Neither `request.auth` (a SimpleJWT AccessToken) nor `request.user` (the User
model) has a `.permissions` attribute — this expression ALWAYS evaluated to [].
Combined with "deny by default" below, every RBAC-protected endpoint returned
403 for every non-super-admin user, regardless of their actual role/permissions.

The canonical source of truth is request.security_context.permissions, an
immutable frozenset[str] built by CookieJWTAuthentication._build_security_context()
(apps/users/api/authentication.py) on every authenticated request, using
RBACService.get_user_permissions_as_frozenset() — BU-scoped, cached, includes
per-user overrides. That's what we read now.
"""
from __future__ import annotations

from rest_framework.request import Request
from django.views import View
from .base_permissions import YSSBasePermission


class HasRBACPermission(YSSBasePermission):
    """
    Checks if the user has the required RBAC permissions to access the view.
    The view must define `required_permissions` (a list of permission strings).

    Resolution order for the permission set (FIX-BUG13):
      1. request.security_context.permissions  (canonical — set by CookieJWTAuthentication,
         BU-scoped, includes RolePermission + UserPermissionOverride)
      2. request.auth["permissions"]            (fallback — raw JWT claim, dict-like
         AccessToken; cross-BU superset set by TokenService._load_platform_permissions)
      3. set()                                   (deny by default)

    Super-admins (request.user.is_super_admin) bypass all permission checks,
    matching SecurityContext.has_permission()'s super-admin short-circuit.
    """

    def has_permission(self, request: Request, view: View) -> bool:
        if not request.user or not request.user.is_authenticated:
            self.log_denial(request, view, "User not authenticated")
            return False

        if getattr(request.user, "is_super_admin", False):
            return True

        required_perms = getattr(view, "required_permissions", [])
        if not required_perms:
            # If no permissions are explicitly required by the view, deny by default
            self.log_denial(request, view, "No permissions defined on view, denying by default")
            return False

        # FIX-BUG13: Resolve the effective permission set from security_context
        # (canonical, BU-scoped) with a JWT-claim fallback.
        user_perms = self._resolve_user_permissions(request)

        # Check if the user has ALL required permissions (ALL strategy for strictness)
        has_perms = all(perm in user_perms for perm in required_perms)

        if not has_perms:
            self.log_denial(request, view, f"Lacks required permissions: {required_perms}")
            return False

        return True

    @staticmethod
    def _resolve_user_permissions(request: Request):
        """
        FIX-BUG13: Resolve the effective permission set for this request.

        request.security_context.permissions is a frozenset[str] built by
        CookieJWTAuthentication from RBACService.get_user_permissions_as_frozenset()
        (role-based permissions + per-user overrides, BU-scoped, cached).

        If security_context is somehow absent (e.g. a non-cookie auth path),
        fall back to the raw "permissions" claim embedded in the JWT itself
        (request.auth is a SimpleJWT AccessToken, which supports dict-style
        access via .get()).
        """
        security_context = getattr(request, "security_context", None)
        if security_context is not None:
            return security_context.permissions  # frozenset[str]

        auth = getattr(request, "auth", None)
        if auth is not None and hasattr(auth, "get"):
            return set(auth.get("permissions", []) or [])

        # Fallback for tests using client.force_authenticate(user=admin_user)
        # where admin_user.permissions is monkey-patched.
        if hasattr(request.user, "permissions"):
            return set(getattr(request.user, "permissions", []))

        return set()

# yss_orbit\backend\apps\pqm\permissions.py
"""
PQM RBAC Permission Definitions and Checker.

All 23 PQM permission codenames are defined as class constants on PQMPermission.
Permission checks use SecurityContext.has_permission() (O(1) frozenset lookup)
via the platform's core permissions infrastructure.

No roles or role names are hardcoded here — RBAC is fully data-driven.
"""
from __future__ import annotations

import logging

from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Try to import platform's RequiresPermission. Fall back gracefully.
# ---------------------------------------------------------------------------
try:
    from apps.platform.core_permissions import RequiresPermission as _PlatformRequiresPermission
    _HAS_PLATFORM_PERMISSION = True
except ImportError:
    _HAS_PLATFORM_PERMISSION = False
    logger.warning(
        "PQM: Could not import RequiresPermission from apps.platform.core_permissions. "
        "Falling back to SecurityContext-based check."
    )


class PQMPermission:
    """
    Namespace for all PQM permission codenames (23 total).

    Usage:
        PQMPermission.check_permission(request, PQMPermission.CREATE_NC)
        PQMPermission.check_permission(request, "pqm.create_nc")
    """

    # ── Visibility ────────────────────────────────────────────────────────────
    VIEW_NC             = "pqm.view_nc"
    VIEW_ALL_BU         = "pqm.view_all_bu"
    VIEW_COMMENTS       = "pqm.view_comments"
    VIEW_AUDIT          = "pqm.view_audit"
    VIEW_DASHBOARD      = "pqm.view_dashboard"
    VIEW_BACKCHARGE     = "pqm.view_backcharge"
    VIEW_SAFETY_CRITICAL = "pqm.view_safety_critical"

    # ── NC Lifecycle ──────────────────────────────────────────────────────────
    CREATE_NC           = "pqm.create_nc"
    EDIT_NC             = "pqm.edit_nc"
    SUBMIT_NC           = "pqm.submit_nc"
    REVIEW_NC           = "pqm.review_nc"
    ASSIGN_NC           = "pqm.assign_nc"
    UPDATE_NC_PROGRESS  = "pqm.update_nc_progress"
    REQUEST_CLOSURE     = "pqm.request_closure"
    VERIFY_NC           = "pqm.verify_nc"
    REOPEN_NC           = "pqm.reopen_nc"
    MERGE_NC            = "pqm.merge_nc"
    LINK_NC             = "pqm.link_nc"

    # ── Collaboration ─────────────────────────────────────────────────────────
    COMMENT_NC          = "pqm.comment_nc"
    UPLOAD_ATTACHMENT   = "pqm.upload_attachment"

    # ── Reporting / Admin ─────────────────────────────────────────────────────
    EXPORT_REPORT       = "pqm.export_report"
    MANAGE_CONFIG       = "pqm.manage_config"
    RUN_LEGACY_IMPORT   = "pqm.run_legacy_import"

    # ── All codenames (for seeding / validation) ─────────────────────────────
    ALL_PERMISSIONS: list[str] = [
        VIEW_NC, VIEW_ALL_BU, VIEW_COMMENTS, VIEW_AUDIT, VIEW_DASHBOARD,
        VIEW_BACKCHARGE, VIEW_SAFETY_CRITICAL, CREATE_NC, EDIT_NC, SUBMIT_NC,
        REVIEW_NC, ASSIGN_NC, UPDATE_NC_PROGRESS, REQUEST_CLOSURE, VERIFY_NC,
        REOPEN_NC, MERGE_NC, LINK_NC, COMMENT_NC, UPLOAD_ATTACHMENT,
        EXPORT_REPORT, MANAGE_CONFIG, RUN_LEGACY_IMPORT,
    ]

    @staticmethod
    def check_permission(request_or_user, codename: str) -> bool:
        """
        Check if user has the given PQM permission codename.

        Resolution order:
        1. SecurityContext.has_permission() — preferred (O(1) frozenset lookup)
        2. user.has_perm() — Django-style fallback
        3. Return False if neither is available

        Platform super-admins (SecurityContext.is_super_admin) bypass all checks.
        """
        # Accept either request (preferred) or user
        user = getattr(request_or_user, "user", request_or_user)
        request = request_or_user if hasattr(request_or_user, "user") else None

        # Check via SecurityContext if available on request or user
        security_ctx = getattr(request, "security_context", None) or getattr(user, "security_context", None)
        if security_ctx is not None:
            return security_ctx.has_permission(codename)

        # Fallback: Django has_perm (for tests / management commands)
        return getattr(user, "has_perm", lambda x: False)(codename)

    @staticmethod
    def require_permission(request_or_user, codename: str) -> None:
        """
        Raise PermissionError if user does not have the given permission.
        Used in service layer.
        """
        if not PQMPermission.check_permission(request_or_user, codename):
            from apps.platform.core_exceptions import PermissionDeniedException
            raise PermissionDeniedException(
                message=f"PQM permission required: {codename}",
                details={"required_permission": codename},
            )


# ---------------------------------------------------------------------------
# DRF Permission Classes
# ---------------------------------------------------------------------------

class HasPQMPermission(BasePermission):
    """
    DRF permission class that checks a specific PQM codename.

    Usage in views:
        permission_classes = [IsAuthenticated, HasPQMPermission]
        required_pqm_permission = PQMPermission.VIEW_NC

    Or use PQMPermission.check_permission() inline within view methods
    for action-specific checks.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        codename = getattr(view, "required_pqm_permission", None)
        if not codename:
            return True  # No specific permission required at view level

        if not request.user or not request.user.is_authenticated:
            return False

        return PQMPermission.check_permission(request, codename)


class IsPQMAuthenticated(IsAuthenticated):
    """
    IsAuthenticated variant that also validates SecurityContext is present.
    Use as the base authentication check for all PQM views.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not super().has_permission(request, view):
            return False
        # Ensure SecurityContext was attached by middleware
        ctx = getattr(request, "security_context", None)
        return ctx is not None


class IsProjectMember(BasePermission):
    """
    Checks if request.user.id is in PQMProjectMember for the project_id provided
    in request.query_params, view.kwargs, or request.data.
    """
    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        project_id = request.query_params.get("project") or request.query_params.get("project_id")
        
        if not project_id and hasattr(view, "kwargs"):
            project_id = view.kwargs.get("project_id")
            
        if not project_id and request.data and isinstance(request.data, dict):
            project_id = request.data.get("project") or request.data.get("project_id")

        if project_id:
            # Bypass check if user is a super admin
            security_ctx = getattr(request, "security_context", None)
            if security_ctx and getattr(security_ctx, "is_super_admin", False):
                return True
                
            from apps.pqm.models.project_access import PQMProjectMember
            return PQMProjectMember.objects.filter(
                user_id=request.user.id,
                project_id=project_id,
                is_deleted=False
            ).exists()

        # If project_id is not found in request, allow pass to let view logic handle it
        return True

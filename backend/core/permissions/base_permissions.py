# yss_orbit\backend\core\permissions\base_permissions.py
"""
YSS Orbit - Base Permissions
Provides base classes for building DRF permissions.
"""
from __future__ import annotations

import logging
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from django.views import View

logger = logging.getLogger(__name__)


class YSSBasePermission(BasePermission):
    """
    Base permission class for all YSS Orbit custom permissions.
    Ensures safe logging and consistent structure.
    """
    
    message = "You do not have permission to perform this action."
    code = "permission_denied"

    def has_permission(self, request: Request, view: View) -> bool:
        """
        Check if the request should be permitted.
        """
        return False

    def has_object_permission(self, request: Request, view: View, obj: any) -> bool:
        """
        Check if the request should be permitted for a given object.
        Defaults to evaluating `has_permission`.
        """
        return self.has_permission(request, view)

    def log_denial(self, request: Request, view: View, reason: str):
        """
        Standardized logging for permission denials.
        """
        user_id = getattr(request.user, "id", "Anonymous")
        logger.warning(
            f"Permission denied for User {user_id} on {view.__class__.__name__}. Reason: {reason}",
            extra={
                "user_id": str(user_id),
                "path": request.path,
                "method": request.method,
                "reason": reason,
            }
        )

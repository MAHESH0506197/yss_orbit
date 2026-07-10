# yss_orbit\backend\core\permissions\scope_permission.py
"""
YSS Orbit - Scope Permission
Validates OAuth2/JWT scopes for API access.
"""
from __future__ import annotations

from rest_framework.request import Request
from django.views import View
from .base_permissions import YSSBasePermission


class HasRequiredScope(YSSBasePermission):
    """
    Checks if the provided token contains the required scopes for the view.
    """

    message = "Token missing required scope."

    def has_permission(self, request: Request, view: View) -> bool:
        if not request.auth:
            self.log_denial(request, view, "No token provided")
            return False

        required_scopes = getattr(view, "required_scopes", [])
        if not required_scopes:
            return True

        # Extract scopes from the parsed token (JWT)
        token_scopes = getattr(request.auth, "scopes", [])
        if isinstance(token_scopes, str):
            token_scopes = token_scopes.split(" ")

        has_scope = any(scope in token_scopes for scope in required_scopes)

        if not has_scope:
            self.log_denial(request, view, f"Missing required scopes: {required_scopes}")
            return False

        return True

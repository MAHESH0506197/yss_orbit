# yss_orbit\backend\core\permissions\module_permission.py
"""
YSS Orbit - Module Permission
Controls access based on enabled SaaS modules or subscriptions.
"""
from __future__ import annotations

from rest_framework.request import Request
from django.views import View
from .base_permissions import YSSBasePermission


class HasModuleEnabled(YSSBasePermission):
    """
    Checks if the requested module is enabled for the current tenant.
    The view must define `required_module` (a string).
    """

    message = "The requested module is not enabled for your subscription."

    def has_permission(self, request: Request, view: View) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(request.user, "is_super_admin", False):
            return True

        required_module = getattr(view, "required_module", None)
        if not required_module:
            return True

        # In a real scenario, this would query the tenant's subscription/billing state
        # We can simulate loading this from the request object or the context
        enabled_modules = getattr(request, "tenant_modules", [])
        
        if required_module not in enabled_modules:
            self.log_denial(request, view, f"Module '{required_module}' is disabled")
            return False

        return True

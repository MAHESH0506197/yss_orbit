# yss_orbit\backend\apps\platform\catalogue\middleware.py
"""
YSS Orbit — Module Subscription Middleware
Enforces that the requested API path belongs to a module the tenant's
organization is subscribed to.

Position in stack: LAST — requires auth + tenant context already set.
"""
from __future__ import annotations

import logging
from typing import Callable

from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths that are ALWAYS accessible regardless of module subscription
# (auth, health, admin, schema, etc.)
# ---------------------------------------------------------------------------
_SUBSCRIPTION_EXEMPT_PREFIXES: tuple[str, ...] = (
    "/api/v1/auth/",
    "/api/v1/me/",
    "/api/v1/organizations/",
    "/api/v1/platform/",
    "/api/schema/",
    "/api/docs/",
    "/api/redoc/",
    "/api/init/",
    "/api/tenant-config/",
    "/api/webhooks/",
    "/health/",
    "/django-admin/",
    "/silk/",
    "/__debug__/",
)

# ---------------------------------------------------------------------------
# Mapping: URL prefix → module code (as stored in PlatformModule.code)
# ---------------------------------------------------------------------------
_MODULE_PATH_MAP: dict[str, str] = {
    "/api/v1/inventory/": "inventory",
    "/api/v1/pos/": "pos",
    "/api/v1/billing/": "billing",
    "/api/v1/customers/": "customers",
    "/api/v1/hrms/": "hrms",
    "/api/v1/attendance/": "attendance",
    "/api/v1/leave/": "leave",
    "/api/v1/payroll/": "payroll",
    "/api/v1/recruitment/": "recruitment",
    "/api/v1/appraisal/": "appraisal",
    "/api/v1/pharmacy/": "pharmacy",
    "/api/v1/reporting/": "reporting",
    "/api/v1/notifications/": "notifications",
    "/api/v1/webhooks-config/": "webhooks",
}


def _get_required_module(path: str) -> str | None:
    """Return the module code required for this path, or None if not gated."""
    for prefix, module_code in _MODULE_PATH_MAP.items():
        if path.startswith(prefix):
            return module_code
    return None


def _is_exempt(path: str) -> bool:
    """Return True if this path bypasses subscription checks."""
    for prefix in _SUBSCRIPTION_EXEMPT_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


class ModuleSubscriptionMiddleware:
    """
    Checks that the tenant's active subscription plan includes the module
    being accessed.

    Flow:
    1. Skip exempt paths (auth, health, admin, etc.)
    2. Determine which module the path belongs to (if any)
    3. If no module gate → allow through
    4. If unauthenticated → allow through (auth middleware handles that)
    5. Query the org's active subscription → check plan includes the module
    6. Deny with 403 if module not included in plan

    Uses select_related to avoid N+1. Results are NOT cached here —
    the DB query is fast and caching subscription state introduces
    consistency risk on plan changes.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        path = request.path_info

        # --- Fast exit: exempt paths ---
        if _is_exempt(path):
            return self.get_response(request)

        # --- Determine which module this path requires ---
        required_module = _get_required_module(path)
        if required_module is None:
            # Path has no module gate
            return self.get_response(request)

        # --- Skip for unauthenticated requests (handled by auth layer) ---
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return self.get_response(request)

        # --- Super-admin bypass ---
        if getattr(request.user, "is_super_admin", False):
            return self.get_response(request)

        # --- Check subscription ---
        business_unit_id = getattr(request, "business_unit_id", None)
        if not business_unit_id:
            return self.get_response(request)

        try:
            has_access = self._check_module_access(business_unit_id, required_module)
        except Exception:
            logger.exception(
                "ModuleSubscriptionMiddleware: error checking subscription",
                extra={
                    "business_unit_id": str(business_unit_id),
                    "module_code": required_module,
                    "path": path,
                    "correlation_id": getattr(request, "correlation_id", "unknown"),
                },
            )
            # Fail open — do not block on infrastructure errors
            return self.get_response(request)

        if not has_access:
            logger.warning(
                "Module access denied: %s not in subscription",
                required_module,
                extra={
                    "business_unit_id": str(business_unit_id),
                    "module_code": required_module,
                    "path": path,
                    "user_id": str(request.user.id),
                    "correlation_id": getattr(request, "correlation_id", "unknown"),
                },
            )
            return JsonResponse(
                {
                    "error": "module_not_subscribed",
                    "detail": (
                        f"Your subscription plan does not include the '{required_module}' module. "
                        "Please upgrade your plan to access this feature."
                    ),
                    "module": required_module,
                },
                status=403,
            )

        return self.get_response(request)

    @staticmethod
    def _check_module_access(business_unit_id: str, module_code: str) -> bool:
        """
        Returns True if the Business Unit has activated the requested module.
        Enforces caching per Rulebook E04.
        """
        from django.core.cache import cache
        from apps.organization.models import BusinessUnitModule

        cache_key = f"module_access:{business_unit_id}:{module_code}"
        
        try:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
        except Exception:
            pass  # Fall through to DB check - cache failure must not block access

        is_active = BusinessUnitModule.objects.filter(
            business_unit_id=business_unit_id,
            module__code=module_code,
            status__in=[BusinessUnitModule.Status.ACTIVE, BusinessUnitModule.Status.TRIAL]
        ).exists()

        try:
            cache.set(cache_key, is_active, timeout=300)
        except Exception:
            pass  # Cache SET failure must not crash operation

        return is_active



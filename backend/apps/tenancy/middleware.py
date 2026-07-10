# yss_orbit\backend\apps\tenancy\middleware.py
"""
YSS Orbit — Tenant Middleware
Resolves the X-Business-Unit-Id header and validates tenant membership.
Attaches TenantContext to the request for downstream use.
"""
from __future__ import annotations

import logging
import uuid
from typing import Any, Callable

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

# Endpoints that do NOT require X-Business-Unit-Id header
_BUSINESS_UNIT_EXEMPT_PATHS = frozenset([
    "/api/init/",
    "/api/v1/auth/login/",
    "/api/v1/auth/logout/",
    "/api/v1/auth/token/refresh/",
    "/api/v1/auth/otp/verify/",
    "/api/v1/auth/otp/resend/",
    "/api/v1/auth/password/forgot/",
    "/api/v1/auth/password/reset/",
    "/api/v1/me/",
    "/api/v1/organizations/",
    "/health/",
    "/health/ready/",
    "/api/schema/",
    "/api/docs/",
    "/api/redoc/",
    "/api/tenant-config/",
    "/api/webhooks/razorpay/",
    "/django-admin/",
])


def _is_exempt(path: str) -> bool:
    """Check if path is exempt from BU header requirement."""
    # Exact match
    if path in _BUSINESS_UNIT_EXEMPT_PATHS:
        return True
    # Prefix match (e.g. /django-admin/*)
    for exempt in _BUSINESS_UNIT_EXEMPT_PATHS:
        if path.startswith(exempt):
            return True
    return False


class TenantMiddleware:
    """
    Resolves X-Business-Unit-Id header → validates user membership → attaches to request.

    This middleware runs AFTER authentication middleware, so request.user is available.

    Sets on request:
    - request.business_unit_id (UUID | None)
    - request.tenant_context (TenantContext | None)

    Does NOT block requests missing the header — that validation happens in the
    view layer via SecurityContext.require_business_unit().
    Public/exempt endpoints work without the header.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request.business_unit_id = None  # type: ignore[attr-defined]
        request.tenant_context = None  # type: ignore[attr-defined]

        # Parse business unit header regardless of auth state (DRF auth happens later)
        # We just attach the ID; auth & permission checks happen in DRF views.

        bu_header = request.headers.get("X-Business-Unit-Id", "").strip()

        if bu_header:
            try:
                bu_id = uuid.UUID(bu_header)
                request.business_unit_id = bu_id  # type: ignore[attr-defined]

                # Log tenant context for tracing
                correlation_id = getattr(request, "correlation_id", "unknown")
                logger.debug(
                    "Tenant context resolved",
                    extra={
                        "business_unit_id": str(bu_id),
                        "user_id": str(getattr(getattr(request, 'user', None), 'id', None)),
                        "correlation_id": correlation_id,
                    },
                )
            except (ValueError, AttributeError):
                logger.warning(
                    "Invalid X-Business-Unit-Id header format",
                    extra={
                        "header_value": bu_header[:100],
                        "correlation_id": getattr(request, "correlation_id", "unknown"),
                    },
                )
                # Invalid UUID format — will be caught by view layer
                request.business_unit_id = None  # type: ignore[attr-defined]

        # Call set_tenant_context if we have a valid BU ID
        if request.business_unit_id:
            from core.tenancy.tenant_context import set_tenant_context, clear_tenant_context
            set_tenant_context(tenant_id=str(request.business_unit_id))
            try:
                response = self.get_response(request)
            finally:
                clear_tenant_context()
            return response
        else:
            return self.get_response(request)

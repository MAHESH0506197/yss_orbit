# yss_orbit\backend\core\middleware\security_context_middleware.py
"""
YSS Orbit — Security Context Middleware
Sets the per-request security context thread-local for ambient access in services.

3.6 fix: B02 §5.1 — Uses X-Business-Unit-Id (NOT X-Tenant-ID / request.tenant).
         E03 §5.2 — Threads correlation_id into security context for distributed tracing.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from core.security.security_context import set_security_context, clear_security_context


class SecurityContextMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.user.is_authenticated:
            # 3.6 fix: B02 §5.1 — X-Business-Unit-Id (NOT X-Tenant-ID or request.tenant)
            business_unit_id = request.headers.get("X-Business-Unit-Id") or None
            # E03 §5.2 — Correlation ID from CorrelationIdMiddleware (runs before this)
            correlation_id = getattr(request, "correlation_id", None)

            set_security_context(
                user_id=str(request.user.id),
                business_unit_id=business_unit_id,
                correlation_id=correlation_id,
                is_authenticated=True,
                is_superuser=getattr(request.user, "is_super_admin", False)
                             or request.user.is_superuser,
                scopes=set(),
            )
        try:
            return self.get_response(request)
        finally:
            clear_security_context()

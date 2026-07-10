# yss_orbit\backend\apps\observability\middleware.py
"""
YSS Orbit — Observability Middleware
Injects correlation_id and request_id into every request.
ALL log entries and API responses must carry correlation_id.
"""
from __future__ import annotations

import time
import uuid
import logging

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware:
    """
    Middleware #1 in the stack (after SecurityMiddleware).

    For every request:
    1. Reads X-Correlation-Id header (from upstream proxy/client) OR generates new UUID
    2. Generates unique X-Request-Id for this specific request
    3. Attaches both to request object
    4. Emits structured access log with timing
    5. Sets X-Correlation-Id in response header

    All subsequent middleware and views can read request.correlation_id.
    """

    def __init__(self, get_response: Any) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Extract or generate correlation ID
        correlation_id = (
            request.headers.get("X-Correlation-Id")
            or request.headers.get("X-Request-Id")
            or str(uuid.uuid4())
        )
        request_id = str(uuid.uuid4())

        # Attach to request — all downstream code reads from here
        request.correlation_id = correlation_id  # type: ignore[attr-defined]
        request.request_id = request_id  # type: ignore[attr-defined]

        # Inject into logging context via LogRecord filter
        _log_context.correlation_id = correlation_id
        _log_context.request_id = request_id

        start_time = time.monotonic()

        response = self.get_response(request)

        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        # Set correlation ID in response headers
        response["X-Correlation-Id"] = correlation_id
        response["X-Request-Id"] = request_id

        # Emit structured access log
        user_id = None
        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.id)

        logger.info(
            "HTTP %s %s → %s",
            request.method,
            request.path,
            response.status_code,
            extra={
                "correlation_id": correlation_id,
                "request_id": request_id,
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
                "ip": _get_client_ip(request),
                "user_agent": request.META.get("HTTP_USER_AGENT", "")[:200],
            },
        )

        return response


class _LogContext:
    """Thread-local-like context for log correlation IDs (per request)."""
    correlation_id: str = "no-correlation-id"
    request_id: str = "no-request-id"


_log_context = _LogContext()


def _get_client_ip(request: HttpRequest) -> str:
    """Extract real client IP, accounting for reverse proxies."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


# Import Any at module level
from typing import Any  # noqa: E402

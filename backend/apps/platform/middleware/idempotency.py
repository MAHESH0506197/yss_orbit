# yss_orbit\backend\apps\core\middleware\idempotency.py
"""
YSS Orbit — Idempotency Middleware
Caches POST/PUT/PATCH responses for 24h using Idempotency-Key header.
Prevents duplicate operations on retried requests (network failures, timeouts).
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Callable

from django.core.cache import caches
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

_cache = caches["default"]

# Only apply idempotency to these HTTP methods
_IDEMPOTENT_METHODS = frozenset(["POST", "PUT", "PATCH"])

# Endpoints that REQUIRE idempotency keys (financial operations)
_REQUIRE_IDEMPOTENCY_PATHS = frozenset([
    "/api/v1/pos/",
    "/api/v1/billing/",
    "/api/v1/payroll/",
    "/api/v1/inventory/stock-adjustments/",
])


class IdempotencyMiddleware:
    """
    Idempotency middleware for safe retries.

    Client sends: Idempotency-Key: <uuid>
    On first request: process + cache response for 24h
    On retry with same key + same payload: return cached response

    Cache key: idempotency:{user_id}:{path}:{idempotency_key}

    If same key but different payload → return 409 Conflict
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.method not in _IDEMPOTENT_METHODS:
            return self.get_response(request)

        idempotency_key = request.headers.get("Idempotency-Key", "").strip()

        if not idempotency_key:
            # Check if endpoint requires idempotency key
            for path in _REQUIRE_IDEMPOTENCY_PATHS:
                if request.path.startswith(path):
                    logger.warning(
                        "Missing Idempotency-Key on required endpoint",
                        extra={
                            "path": request.path,
                            "correlation_id": getattr(request, "correlation_id", "unknown"),
                        },
                    )
                    break
            return self.get_response(request)

        # Build cache key
        user_id = "anon"
        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.id)

        cache_key = f"idempotency:{user_id}:{request.path}:{idempotency_key}"

        # Hash request body for conflict detection
        try:
            body_hash = hashlib.sha256(request.body).hexdigest()
        except Exception:
            body_hash = ""

        cached = _cache.get(cache_key)

        if cached is not None:
            stored_body_hash = cached.get("body_hash")

            # Conflict: same key, different body
            if stored_body_hash and stored_body_hash != body_hash:
                from apps.platform import core_error_codes as ec
                import uuid
                correlation_id = getattr(request, "correlation_id", "unknown")
                trace_id = getattr(request, "trace_id", str(uuid.uuid4()))
                return JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": ec.CONFLICT,
                            "message": "Idempotency key conflict: same key used with different request payload.",
                        },
                        "meta": {
                            "trace_id": trace_id,
                            "correlation_id": correlation_id
                        },
                    },
                    status=409,
                )

            # Return cached response
            logger.debug(
                "Returning cached idempotent response",
                extra={
                    "idempotency_key": idempotency_key[:50],
                    "path": request.path,
                    "correlation_id": getattr(request, "correlation_id", "unknown"),
                },
            )
            response = HttpResponse(
                content=cached["body"],
                status=cached["status"],
                content_type=cached.get("content_type", "application/json"),
            )
            response["X-Idempotency-Replayed"] = "true"
            response["X-Correlation-Id"] = getattr(request, "correlation_id", "unknown")
            return response

        # First request — process and cache
        response = self.get_response(request)

        # Only cache successful responses
        if 200 <= response.status_code < 300:
            _cache.set(
                cache_key,
                {
                    "body": response.content,
                    "status": response.status_code,
                    "content_type": response.get("Content-Type", "application/json"),
                    "body_hash": body_hash,
                },
                timeout=24 * 3600,  # 24 hours
            )

        return response

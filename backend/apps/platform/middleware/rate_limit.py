# yss_orbit\backend\apps\core\middleware\rate_limit.py
"""
YSS Orbit — Rate Limit Middleware
Sliding window rate limiting per user + per plan.
Auth endpoints: additional per-IP limiting.
Redis DB 2 (dedicated rate limit cache).
"""
from __future__ import annotations

import logging
import time
from typing import Any, Callable

from django.conf import settings
from django.core.cache import caches
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

_rl_cache = caches["rate_limit"]

# Default limits per plan (requests per minute)
_DEFAULT_LIMITS = {
    "FREE": 100,
    "BASIC": 500,
    "PRO": 2000,
    "ENTERPRISE": 10000,
    "SUPER_ADMIN": 99999,
}

# Auth endpoints: per-IP sliding window (10 requests per minute)
_AUTH_IP_LIMIT = 10
_AUTH_IP_WINDOW = 60

_AUTH_PATHS = frozenset([
    "/api/v1/auth/login/",
    "/api/v1/auth/otp/",
    "/api/v1/auth/password/",
])

# Global rate limit for unauthenticated requests
_ANON_LIMIT = 30
_WINDOW_SECONDS = 60


def _get_client_ip(request: HttpRequest) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


class RateLimitMiddleware:
    """
    Sliding window rate limiter using Redis atomic MULTI/EXEC.

    Per-user limit: based on subscription plan
    Per-IP limit: for auth endpoints (brute force protection)
    Anonymous: 30 rpm (prevents scraping without login)
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Get client info
        ip = _get_client_ip(request)
        now = int(time.time())
        window_start = now - _WINDOW_SECONDS

        # ─── Per-IP limit on auth endpoints ──────────────────────────────
        is_auth_path = any(request.path.startswith(p) for p in _AUTH_PATHS)
        if is_auth_path:
            ip_key = f"rl:ip:{ip}:{request.path}"
            ip_count = self._sliding_window_count(ip_key, now, window_start, _AUTH_IP_WINDOW)
            if ip_count > _AUTH_IP_LIMIT:
                from apps.platform import core_error_codes as ec
                import uuid
                correlation_id = getattr(request, "correlation_id", "unknown")
                trace_id = getattr(request, "trace_id", str(uuid.uuid4()))
                logger.warning(
                    "Auth IP rate limit exceeded",
                    extra={"ip": ip, "path": request.path, "count": ip_count, "correlation_id": correlation_id},
                )
                response = JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": ec.RATE_LIMIT_EXCEEDED,
                            "message": "Too many requests from this IP address. Please wait.",
                        },
                        "meta": {
                            "trace_id": trace_id,
                            "correlation_id": correlation_id
                        },
                    },
                    status=429,
                )
                response["Retry-After"] = str(_AUTH_IP_WINDOW)
                response["X-RateLimit-Limit"] = str(_AUTH_IP_LIMIT)
                response["X-RateLimit-Remaining"] = "0"
                return response

        # ─── Per-user limit ───────────────────────────────────────────────
        if hasattr(request, "user") and request.user.is_authenticated:
            plan = getattr(request, "subscription_plan", "FREE")
            limit = _DEFAULT_LIMITS.get(plan, _DEFAULT_LIMITS["FREE"])

            if request.user.is_super_admin:
                limit = _DEFAULT_LIMITS["SUPER_ADMIN"]

            user_key = f"rl:user:{request.user.id}"
            user_count = self._sliding_window_count(user_key, now, window_start, _WINDOW_SECONDS)

            remaining = max(0, limit - user_count)

            if user_count > limit:
                from apps.platform import core_error_codes as ec
                import uuid
                correlation_id = getattr(request, "correlation_id", "unknown")
                trace_id = getattr(request, "trace_id", str(uuid.uuid4()))
                response = JsonResponse(
                    {
                        "success": False,
                        "error": {
                            "code": ec.RATE_LIMIT_EXCEEDED,
                            "message": "Rate limit exceeded for your plan. Please slow down.",
                        },
                        "meta": {
                            "trace_id": trace_id,
                            "correlation_id": correlation_id
                        },
                    },
                    status=429,
                )
                response["X-RateLimit-Limit"] = str(limit)
                response["X-RateLimit-Remaining"] = "0"
                response["X-RateLimit-Reset"] = str(now + _WINDOW_SECONDS)
                response["Retry-After"] = str(_WINDOW_SECONDS)
                return response

            response = self.get_response(request)
            response["X-RateLimit-Limit"] = str(limit)
            response["X-RateLimit-Remaining"] = str(remaining)
            response["X-RateLimit-Reset"] = str(now + _WINDOW_SECONDS)
            return response

        # ─── Anonymous limit ──────────────────────────────────────────────
        anon_key = f"rl:anon:{ip}"
        anon_count = self._sliding_window_count(anon_key, now, window_start, _WINDOW_SECONDS)

        if anon_count > _ANON_LIMIT:
            from apps.platform import core_error_codes as ec
            import uuid
            correlation_id = getattr(request, "correlation_id", "unknown")
            trace_id = getattr(request, "trace_id", str(uuid.uuid4()))
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": ec.RATE_LIMIT_EXCEEDED,
                        "message": "Rate limit exceeded.",
                    },
                    "meta": {
                        "trace_id": trace_id,
                        "correlation_id": correlation_id
                    },
                },
                status=429,
            )

        return self.get_response(request)

    def _sliding_window_count(
        self,
        key: str,
        now: int,
        window_start: int,
        window_seconds: int,
    ) -> int:
        """
        Sliding window counter using Redis sorted set.
        Each request adds an entry with timestamp as score.
        Count = entries with score > window_start.
        """
        try:
            pipe = _rl_cache.client.get_client().pipeline()
            pipe.zremrangebyscore(key, "-inf", window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcount(key, window_start, "+inf")
            pipe.expire(key, window_seconds)
            _, _, count, _ = pipe.execute()
            return count
        except AttributeError:
            # Fallback for LocMemCache in tests
            return 1

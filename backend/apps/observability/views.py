# yss_orbit\backend\apps\observability\views.py
"""
YSS Orbit — Health Check Views
Kubernetes liveness/readiness probes.
/health/ready/ — checks DB + Redis (readiness)
/health/live/ — always returns 200 (liveness)
/health/detail/ — full diagnostics (authenticated + super admin only)
"""
from __future__ import annotations

import time

from django.db import connection
from django.core.cache import caches
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(["GET"])
@permission_classes([AllowAny])
def liveness(request) -> JsonResponse:
    """K8s liveness probe — always 200 if process is alive."""
    return JsonResponse({"status": "alive", "service": "yss-orbit-api"})


@api_view(["GET"])
@permission_classes([AllowAny])
def readiness(request) -> JsonResponse:
    """
    K8s readiness probe.
    Checks DB connectivity and Redis connectivity.
    Returns 200 if ready, 503 if not.
    """
    checks = {}
    overall_ok = True

    # Database check
    try:
        start = time.monotonic()
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks["database"] = {
            "status": "ok",
            "latency_ms": round((time.monotonic() - start) * 1000, 2),
        }
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)[:200]}
        overall_ok = False

    # Redis check
    try:
        start = time.monotonic()
        cache = caches["default"]
        cache.set("health_check", "ok", timeout=10)
        val = cache.get("health_check")
        checks["redis"] = {
            "status": "ok" if val == "ok" else "error",
            "latency_ms": round((time.monotonic() - start) * 1000, 2),
        }
        if val != "ok":
            overall_ok = False
    except Exception as e:
        checks["redis"] = {"status": "error", "message": str(e)[:200]}
        overall_ok = False

    status_code = 200 if overall_ok else 503
    return JsonResponse(
        {
            "status": "ready" if overall_ok else "not_ready",
            "service": "yss-orbit-api",
            "checks": checks,
        },
        status=status_code,
    )

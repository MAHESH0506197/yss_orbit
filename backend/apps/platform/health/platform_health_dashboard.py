# yss_orbit\backend\apps\platform\health\platform_health_dashboard.py
"""
YSS Orbit — Platform Health Views
Infrastructure health checks for platform monitoring.
These endpoints are called by Prometheus/Grafana and internal dashboards.
"""
from __future__ import annotations

import logging
import time

from django.db import connection
from django.core.cache import caches
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_permissions import IsAuthenticated, IsSuperAdmin
from apps.platform.core_response import success_response

logger = logging.getLogger(__name__)


def _check_database() -> dict:
    try:
        start = time.monotonic()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "ok", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as e:
        return {"status": "error", "message": str(e)[:200]}


def _check_redis() -> dict:
    try:
        start = time.monotonic()
        cache = caches["default"]
        cache.set("infra_health", "ok", timeout=10)
        val = cache.get("infra_health")
        ok = val == "ok"
        return {"status": "ok" if ok else "error", "latency_ms": round((time.monotonic() - start) * 1000, 2)}
    except Exception as e:
        return {"status": "error", "message": str(e)[:200]}


def _check_celery() -> dict:
    try:
        from celery import current_app
        i = current_app.control.inspect(timeout=1.0)
        stats = i.stats()
        if stats:
            worker_count = len(stats)
            return {"status": "ok", "active_workers": worker_count}
        return {"status": "degraded", "message": "No Celery workers responding"}
    except Exception as e:
        return {"status": "error", "message": str(e)[:200]}


class InfrastructureHealthView(APIView):
    """
    GET /api/v1/platform/health/infrastructure/
    Full infrastructure health check. Super-admin only.
    Returns status of DB, Redis, Celery.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request: Request) -> Response:
        checks = {
            "database": _check_database(),
            "redis": _check_redis(),
            "celery": _check_celery(),
        }
        overall = all(c.get("status") == "ok" for c in checks.values())
        return success_response(
            data={
                "status": "healthy" if overall else "degraded",
                "checks": checks,
            },
            request=request,
        )


class PlatformHealthDashboardView(APIView):
    """
    GET /api/v1/platform/health/dashboard/
    High-level platform health summary. Super-admin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request: Request) -> Response:
        from apps.organization.models.organization_model import Organization, BusinessUnit
        from apps.iam.models import User

        org_count = Organization.objects.count()
        bu_count = BusinessUnit.objects.count()
        user_count = User.objects.count()

        return success_response(
            data={
                "organizations": org_count,
                "business_units": bu_count,
                "users": user_count,
                "infrastructure": {
                    "database": _check_database(),
                    "redis": _check_redis(),
                },
            },
            request=request,
        )

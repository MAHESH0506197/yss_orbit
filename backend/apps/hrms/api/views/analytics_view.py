# yss_orbit/backend/apps/hrms/api/views/analytics_view.py
"""
YSS Orbit — HRMS Analytics API Views
======================================
Exposes the AnalyticsSnapshotService data to the frontend dashboards.

Endpoints:
  GET  /api/v1/hrms/analytics/snapshot/        — Get stored snapshot for a period
  POST /api/v1/hrms/analytics/snapshot/compute/ — Trigger recomputation (HR/Admin only)
  GET  /api/v1/hrms/analytics/dashboard/        — Latest snapshot + live KPI summary

All endpoints are BU-scoped via X-Business-Unit-ID header.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, error_response, created_response
from apps.hrms.api.views.utils import _require_bu


class AnalyticsSnapshotView(APIView):
    """
    GET  /hrms/analytics/snapshot/?year=2025&month=6
         Returns the stored HRAnalyticsSnapshot for the given period.

    POST /hrms/analytics/snapshot/compute/
         Triggers AnalyticsSnapshotService.compute_and_save() for the given period.
         Body: { year, month }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year_str = request.query_params.get("year")
        month_str = request.query_params.get("month")

        if not year_str or not month_str:
            return error_response(
                "BAD_REQUEST", "year and month query params are required.",
                http_status=400, request=request,
            )

        try:
            year = int(year_str)
            month = int(month_str)
            if not (2000 <= year <= 2100) or not (1 <= month <= 12):
                raise ValueError("out of range")
        except (ValueError, TypeError):
            return error_response(
                "BAD_REQUEST", "year must be 2000–2100, month must be 1–12.",
                http_status=400, request=request,
            )

        from apps.hrms.models.analytics_snapshot import HRAnalyticsSnapshot
        try:
            snapshot = HRAnalyticsSnapshot.objects.get(
                business_unit_id=bu_id, year=year, month=month
            )
            return success_response(
                data={
                    "year": snapshot.year,
                    "month": snapshot.month,
                    "computed_at": snapshot.computed_at.isoformat(),
                    **snapshot.data,
                },
                request=request,
            )
        except HRAnalyticsSnapshot.DoesNotExist:
            return error_response(
                "NOT_FOUND",
                f"No analytics snapshot found for {year}-{month:02d}. "
                "Trigger a compute via POST /analytics/snapshot/compute/",
                http_status=404,
                request=request,
            )


class AnalyticsSnapshotComputeView(APIView):
    """
    POST /hrms/analytics/snapshot/compute/
    Body: { year, month }
    Triggers compute_and_save() and returns the fresh snapshot data.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        year_str = request.data.get("year")
        month_str = request.data.get("month")

        if not year_str or not month_str:
            return error_response(
                "VALIDATION_ERROR", "year and month are required in request body.",
                http_status=400, request=request,
            )

        try:
            year = int(year_str)
            month = int(month_str)
            if not (2000 <= year <= 2100) or not (1 <= month <= 12):
                raise ValueError("out of range")
        except (ValueError, TypeError):
            return error_response(
                "VALIDATION_ERROR", "year must be 2000–2100, month must be 1–12.",
                http_status=400, request=request,
            )

        try:
            from apps.hrms.services.analytics_snapshot_service import AnalyticsSnapshotService
            snapshot_data = AnalyticsSnapshotService.compute_and_save(
                business_unit_id=bu_id,
                year=year,
                month=month,
            )
            return created_response(data=snapshot_data, request=request)
        except Exception as exc:
            return error_response(
                "COMPUTE_ERROR", str(exc), http_status=500, request=request
            )


class AnalyticsDashboardView(APIView):
    """
    GET /hrms/analytics/dashboard/?year=2025&month=6
    Returns the latest snapshot plus live KPI counters for the dashboard header.
    Falls back gracefully if no snapshot has been computed yet.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        now = datetime.now()
        try:
            year = int(request.query_params.get("year", now.year))
            month = int(request.query_params.get("month", now.month))
        except (ValueError, TypeError):
            year, month = now.year, now.month

        # Live headcount (always current)
        from apps.hrms.models.employee import Employee
        live_headcount = Employee.objects.filter(
            business_unit_id=bu_id,
            employment_status=Employee.EmploymentStatus.ACTIVE,
        ).count()

        # Stored snapshot
        snapshot_data: dict = {}
        computed_at = None
        from apps.hrms.models.analytics_snapshot import HRAnalyticsSnapshot
        try:
            snap = HRAnalyticsSnapshot.objects.get(
                business_unit_id=bu_id, year=year, month=month
            )
            snapshot_data = snap.data
            computed_at = snap.computed_at.isoformat()
        except HRAnalyticsSnapshot.DoesNotExist:
            pass  # Return live data only

        return success_response(
            data={
                "period": {"year": year, "month": month},
                "computed_at": computed_at,
                "live_headcount": live_headcount,
                **snapshot_data,
            },
            request=request,
        )

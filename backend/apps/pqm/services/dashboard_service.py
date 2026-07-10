# yss_orbit\backend\apps\pqm\services\dashboard_service.py
"""Dashboard KPI aggregations — BU-scoped, cache-friendly."""
from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from django.db.models import Count, Avg, Q, F
from django.core.cache import cache


class DashboardService:

    @staticmethod
    def get_kpi_summary(
        organization_id: uuid.UUID,
        business_unit_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
    ) -> dict:
        cache_key = f"pqm_kpi_{organization_id}_{business_unit_id}_{project_id}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result

        from apps.pqm.models import NonConformance
        from apps.pqm.enums import NCStatus, Priority

        filters: dict = {"organization_id": organization_id, "is_deleted": False}
        if business_unit_id:
            filters["business_unit_id"] = business_unit_id
        if project_id:
            filters["project_id"] = project_id

        today = date.today()
        qs = NonConformance.objects.filter(**filters)

        terminal = [NCStatus.CLOSED, NCStatus.MERGED, NCStatus.REJECTED]
        open_statuses = [s for s in NCStatus.values if s not in terminal]

        total = qs.count()
        open_ncs = qs.filter(status__in=open_statuses).count()
        closed = qs.filter(status=NCStatus.CLOSED).count()
        overdue = qs.filter(
            target_closure_date__lt=today,
            status__in=open_statuses,
        ).count()
        critical = qs.filter(priority__system_mapping="Critical", status__in=open_statuses).count()
        high = qs.filter(priority__system_mapping="High", status__in=open_statuses).count()
        safety_critical_open = qs.filter(is_safety_critical=True, status__in=open_statuses).count()

        closed_qs = qs.filter(status=NCStatus.CLOSED, actual_closure_date__isnull=False)
        avg_result = closed_qs.aggregate(
            avg_days=Avg(F("actual_closure_date") - F("raised_date"))
        )
        avg_closure_days = 0.0
        if avg_result["avg_days"] is not None:
            # Django returns timedelta — convert to float days
            try:
                avg_closure_days = round(avg_result["avg_days"].days, 1)
            except AttributeError:
                avg_closure_days = round(float(avg_result["avg_days"]), 1)

        # SLA compliance: % closed within original target date
        total_closed = closed_qs.count()
        on_time = closed_qs.filter(actual_closure_date__lte=F("target_closure_date")).count()
        sla_compliance_pct = round((on_time / total_closed * 100) if total_closed else 0.0, 1)

        reopened = qs.filter(reopen_count__gt=0).count()
        reopen_rate_pct = round((reopened / total * 100) if total else 0.0, 1)

        result = {
            "total_ncs": total,
            "open_ncs": open_ncs,
            "closed_ncs": closed,
            "overdue_ncs": overdue,
            "critical_ncs": critical,
            "high_priority_ncs": high,
            "safety_critical_open": safety_critical_open,
            "avg_closure_days": avg_closure_days,
            "sla_compliance_pct": sla_compliance_pct,
            "reopen_rate_pct": reopen_rate_pct,
        }
        cache.set(cache_key, result, 120)
        return result

    @staticmethod
    def get_trend_analytics(
        organization_id: uuid.UUID,
        business_unit_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
    ) -> list[dict]:
        cache_key = f"pqm_trend_{organization_id}_{business_unit_id}_{project_id}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result

        from apps.pqm.models import NonConformance
        from django.db.models.functions import TruncMonth
        from django.db.models import Count

        filters: dict = {"organization_id": organization_id, "is_deleted": False}
        if business_unit_id:
            filters["business_unit_id"] = business_unit_id
        if project_id:
            filters["project_id"] = project_id

        # Group NCs created by month
        qs = NonConformance.objects.filter(**filters)
        created_trends = (
            qs.annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(created_count=Count('id'))
            .order_by('month')
        )

        result = [
            {
                "month": entry["month"].strftime("%Y-%m") if entry["month"] else None,
                "created_count": entry["created_count"]
            }
            for entry in created_trends if entry["month"]
        ]
        cache.set(cache_key, result, 120)
        return result


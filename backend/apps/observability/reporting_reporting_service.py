# yss_orbit\backend\apps\reporting\reporting_service.py
"""
YSS Orbit — Reporting Service
Aggregates data across domains for dashboard and analytics views.
Manages ReportTemplates and Executions.
"""
from __future__ import annotations

import uuid
from datetime import date, timedelta
from typing import Any, Dict, List, Optional
from django.db.models import Sum, Count, Q
from django.db.models.query import QuerySet
from django.utils import timezone

from apps.billing.models import Invoice
from apps.hrms.models import Employee
from apps.pos.models.pos_session_model import POSTransaction
from apps.hrms.models import LeaveRequest
from apps.hrms.models import AttendanceRecord
from .models import ReportTemplate, ReportExecution

class ReportingService:

    # -- High-level aggregations (existing) --

    def get_dashboard_kpis(self, bu_id: uuid.UUID) -> dict[str, Any]:
        """High-level KPIs for the main dashboard."""
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        
        active_employees = Employee.objects.filter(business_unit_id=bu_id, is_active=True).count()
        
        pos_revenue = POSTransaction.objects.filter(
            business_unit_id=bu_id, 
            status="COMPLETED",
            created_at__gte=first_day_of_month
        ).aggregate(total=Sum("total_amount"))["total"] or 0
        
        billing_revenue = Invoice.objects.filter(
            business_unit_id=bu_id,
            status="PAID",
            issue_date__gte=first_day_of_month
        ).aggregate(total=Sum("total_amount"))["total"] or 0
        
        total_monthly_revenue = float(pos_revenue) + float(billing_revenue)
        
        present_count = AttendanceRecord.objects.filter(
            business_unit_id=bu_id,
            date=today,
            status="PRESENT"
        ).count()
        
        leave_count = LeaveRequest.objects.filter(
            business_unit_id=bu_id,
            status="APPROVED",
            from_date__lte=today,
            to_date__gte=today
        ).count()

        return {
            "active_employees": active_employees,
            "monthly_revenue": total_monthly_revenue,
            "attendance_today": present_count,
            "leaves_today": leave_count,
        }

    def get_sales_trends(self, bu_id: uuid.UUID, days: int = 30) -> list[dict[str, Any]]:
        """Daily sales trend over the last N days."""
        start_date = timezone.now().date() - timedelta(days=days)
        from django.db.models.functions import TruncDate
        
        pos_trends = POSTransaction.objects.filter(
            business_unit_id=bu_id,
            status="COMPLETED",
            created_at__date__gte=start_date
        ).annotate(date=TruncDate("created_at")).values("date").annotate(
            total=Sum("total_amount"), count=Count("id")
        ).order_by("date")
        
        return list(pos_trends)

    # -- Report Templates & Executions --

    def get_templates(self, bu_id: uuid.UUID) -> QuerySet[ReportTemplate]:
        return ReportTemplate.objects.filter(business_unit_id=bu_id)

    def create_template(self, bu_id: uuid.UUID, data: Dict[str, Any], created_by_id: uuid.UUID) -> ReportTemplate:
        data["business_unit_id"] = bu_id
        data["created_by_id"] = created_by_id
        return ReportTemplate.objects.create(**data)

    def execute_report(self, bu_id: uuid.UUID, template_id: uuid.UUID, created_by_id: uuid.UUID) -> Optional[ReportExecution]:
        template = ReportTemplate.objects.filter(business_unit_id=bu_id, id=template_id).first()
        if not template:
            return None
        
        execution = ReportExecution.objects.create(
            business_unit_id=bu_id,
            template=template,
            created_by_id=created_by_id,
            status=ReportExecution.Status.PENDING
        )
        
        # In a real system, we'd trigger a Celery task here.
        # For demonstration, we'll mark it immediately running.
        execution.status = ReportExecution.Status.RUNNING
        execution.started_at = timezone.now()
        execution.save(update_fields=["status", "started_at"])
        
        return execution

    def get_executions(self, bu_id: uuid.UUID, template_id: uuid.UUID) -> QuerySet[ReportExecution]:
        return ReportExecution.objects.filter(business_unit_id=bu_id, template_id=template_id)

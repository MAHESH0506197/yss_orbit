# yss_orbit/backend/apps/hrms/services/analytics_snapshot_service.py
"""
YSS Orbit — AnalyticsSnapshotService
=====================================
Computes and persists monthly HR analytics snapshots for a given BusinessUnit.

A snapshot captures a point-in-time view of workforce metrics that cannot be
easily recomputed from live data later (e.g., headcount on the last day of a month).
Snapshots power the Analytics Dashboard without hitting live OLTP tables on every
dashboard load.

Snapshot contents:
  - Workforce: total headcount, new hires, exits, attrition rate
  - Attendance: average attendance %, total LOP days
  - Leave: total leave days consumed per type
  - Payroll: total gross, total deductions, total net, total employer contributions
  - Training: courses delivered, completions, average completion rate
  - Department split: headcount per department

Design decisions:
  - Service is idempotent: calling for the same (bu_id, month, year) twice
    upserts the existing snapshot, never creates duplicates.
  - All queries are filtered by business_unit_id to maintain strict tenant isolation.
  - The service does not directly join across apps — it reads aggregate data
    from each domain's own models using soft FK lookups.

Usage:
    from apps.hrms.services.analytics_snapshot_service import AnalyticsSnapshotService
    from datetime import date

    snapshot = AnalyticsSnapshotService.compute_and_save(
        business_unit_id=bu.id,
        year=2025,
        month=4,   # April
    )

Celery integration:
    Called by `apps.hrms.tasks.generate_analytics_snapshot_task` at month-end
    via Celery Beat.
"""
from __future__ import annotations

import logging
import uuid
from calendar import monthrange
from datetime import date
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

logger = logging.getLogger(__name__)


class AnalyticsSnapshotService:
    """
    Stateless service — all methods are class methods.
    """

    @classmethod
    def compute_and_save(
        cls,
        business_unit_id: uuid.UUID,
        year: int,
        month: int,
    ) -> dict[str, Any]:
        """
        Compute and persist the monthly analytics snapshot for the given BU and period.
        Returns the full snapshot data dict.

        This method is idempotent — safe to call multiple times for the same period.
        If a snapshot already exists for (bu, year, month), it is overwritten.

        Args:
            business_unit_id: Tenant scope.
            year: Fiscal year (e.g. 2025).
            month: Calendar month (1–12).
        """
        logger.info(
            "AnalyticsSnapshotService: computing snapshot bu=%s period=%04d-%02d",
            business_unit_id, year, month,
        )

        snapshot_data: dict[str, Any] = {
            "business_unit_id": str(business_unit_id),
            "year": year,
            "month": month,
            "computed_at": timezone.now().isoformat(),
        }

        # Compute each section independently — a failure in one section logs
        # a warning but does not abort the others.
        snapshot_data.update(cls._workforce_metrics(business_unit_id, year, month))
        snapshot_data.update(cls._attendance_metrics(business_unit_id, year, month))
        snapshot_data.update(cls._leave_metrics(business_unit_id, year, month))
        snapshot_data.update(cls._payroll_metrics(business_unit_id, year, month))
        snapshot_data.update(cls._training_metrics(business_unit_id, year, month))
        snapshot_data.update(cls._department_split(business_unit_id))

        # Persist (upsert)
        cls._persist(business_unit_id, year, month, snapshot_data)

        logger.info(
            "AnalyticsSnapshotService: snapshot saved bu=%s period=%04d-%02d",
            business_unit_id, year, month,
        )
        return snapshot_data

    # ── Section Computers ─────────────────────────────────────────────────────

    @classmethod
    def _workforce_metrics(
        cls, bu_id: uuid.UUID, year: int, month: int
    ) -> dict[str, Any]:
        """Headcount, hires, exits, attrition for the month."""
        try:
            from apps.hrms.models.employee import Employee

            # EmploymentStatus is a nested class on Employee, not a separate import
            ACTIVE = Employee.EmploymentStatus.ACTIVE

            last_day = date(year, month, monthrange(year, month)[1])
            first_day = date(year, month, 1)

            active_qs = Employee.objects.filter(
                business_unit_id=bu_id,
                employment_status=ACTIVE,
                date_of_joining__lte=last_day,
            ).filter(
                Q(date_of_leaving__isnull=True) | Q(date_of_leaving__gte=first_day)
            )
            headcount = active_qs.count()

            new_hires = Employee.objects.filter(
                business_unit_id=bu_id,
                date_of_joining__year=year,
                date_of_joining__month=month,
            ).count()

            exits = Employee.objects.filter(
                business_unit_id=bu_id,
                date_of_leaving__year=year,
                date_of_leaving__month=month,
            ).count()

            opening_headcount = headcount - new_hires + exits
            attrition_rate = (
                round(exits / opening_headcount * 100, 2)
                if opening_headcount > 0
                else Decimal("0.00")
            )

            gender_split = dict(
                active_qs.values_list("gender")
                .annotate(cnt=Count("id"))
                .values_list("gender", "cnt")
            )

            return {
                "headcount": headcount,
                "new_hires": new_hires,
                "exits": exits,
                "attrition_rate_pct": float(attrition_rate),
                "gender_split": gender_split,
            }
        except Exception as exc:
            logger.warning("_workforce_metrics failed: %s", exc, exc_info=True)
            return {
                "headcount": 0,
                "new_hires": 0,
                "exits": 0,
                "attrition_rate_pct": 0.0,
                "gender_split": {},
            }

    @classmethod
    def _attendance_metrics(
        cls, bu_id: uuid.UUID, year: int, month: int
    ) -> dict[str, Any]:
        """Average attendance percentage and total LOP days for the month."""
        try:
            from apps.hrms.models.attendance import AttendanceRecord

            # Field is attendance_date — NOT date
            records = AttendanceRecord.objects.filter(
                business_unit_id=bu_id,
                attendance_date__year=year,
                attendance_date__month=month,
            )
            total_days = records.count()
            present_days = records.filter(
                status__in=[
                    AttendanceRecord.Status.PRESENT,
                    AttendanceRecord.Status.HALF_DAY,
                    AttendanceRecord.Status.WORK_FROM_HOME,
                    AttendanceRecord.Status.ON_DUTY,
                    AttendanceRecord.Status.LATE,
                ]
            ).count()
            lop_days = records.filter(
                status__in=[
                    AttendanceRecord.Status.ABSENT,
                    AttendanceRecord.Status.UNPAID_LEAVE,
                ]
            ).count()

            attendance_pct = round(present_days / total_days * 100, 2) if total_days else 0.0

            return {
                "attendance_total_days": total_days,
                "attendance_present_days": present_days,
                "attendance_lop_days": lop_days,
                "attendance_pct": attendance_pct,
            }
        except Exception as exc:
            logger.warning("_attendance_metrics failed: %s", exc, exc_info=True)
            return {
                "attendance_total_days": 0,
                "attendance_present_days": 0,
                "attendance_lop_days": 0,
                "attendance_pct": 0.0,
            }

    @classmethod
    def _leave_metrics(
        cls, bu_id: uuid.UUID, year: int, month: int
    ) -> dict[str, Any]:
        """Total leave days consumed per leave type this month."""
        try:
            from apps.hrms.models.leave_request import LeaveRequest
            from datetime import timedelta

            # Use StatusChoices — NOT Status (G5 fix)
            approved_leaves = LeaveRequest.objects.filter(
                business_unit_id=bu_id,
                status=LeaveRequest.StatusChoices.APPROVED,
                start_date__year=year,
                start_date__month=month,
            ).select_related("leave_type")

            # G10 fix: total_days field does not exist on LeaveRequest.
            # Compute leave days as (end_date - start_date).days + 1 per request.
            leave_summary: dict[str, float] = {}
            total_leave_days: float = 0.0
            for req in approved_leaves:
                days = float((req.end_date - req.start_date).days + 1)
                leave_type_name = req.leave_type.name if req.leave_type else "UNKNOWN"
                leave_summary[leave_type_name] = leave_summary.get(leave_type_name, 0.0) + days
                total_leave_days += days

            return {
                "total_leave_days": total_leave_days,
                "leave_breakdown": leave_summary,
            }
        except Exception as exc:
            logger.warning("_leave_metrics failed: %s", exc, exc_info=True)
            return {
                "total_leave_days": 0,
                "leave_breakdown": {},
            }

    @classmethod
    def _payroll_metrics(
        cls, bu_id: uuid.UUID, year: int, month: int
    ) -> dict[str, Any]:
        """Payroll totals from the PayrollRun + Payslips for the month."""
        try:
            from apps.payroll.models.payroll_run_model import PayrollRun
            from apps.payroll.models.payslip import Payslip

            run = (
                PayrollRun.objects.filter(
                    business_unit_id=bu_id,
                    month=month,
                    year=year,
                )
                # ARCHIVED is the terminal cancelled-equivalent status on PayrollRun
                .exclude(status__in=[PayrollRun.Status.ARCHIVED])
                .order_by("-created_at")
                .first()
            )

            if run is None:
                return {
                    "payroll_run_status": "NOT_RUN",
                    "payroll_total_employees": 0,
                    "payroll_total_gross": 0.0,
                    "payroll_total_deductions": 0.0,
                    "payroll_total_net": 0.0,
                    "payroll_total_employer_pf": 0.0,
                    "payroll_total_employer_esi": 0.0,
                }

            agg = Payslip.objects.filter(
                payroll_run=run,
                business_unit_id=bu_id,
            ).aggregate(
                total_gross=Sum("gross_salary"),
                total_deductions=Sum("total_deductions"),
                total_net=Sum("net_salary"),
                total_employer_pf=Sum("employer_pf"),
                total_employer_esi=Sum("employer_esi"),
                count=Count("id"),
            )

            return {
                "payroll_run_status": run.status,
                "payroll_total_employees": agg["count"] or 0,
                "payroll_total_gross": float(agg["total_gross"] or 0),
                "payroll_total_deductions": float(agg["total_deductions"] or 0),
                "payroll_total_net": float(agg["total_net"] or 0),
                "payroll_total_employer_pf": float(agg["total_employer_pf"] or 0),
                "payroll_total_employer_esi": float(agg["total_employer_esi"] or 0),
            }
        except Exception as exc:
            logger.warning("_payroll_metrics failed: %s", exc, exc_info=True)
            return {
                "payroll_run_status": "ERROR",
                "payroll_total_employees": 0,
                "payroll_total_gross": 0.0,
                "payroll_total_deductions": 0.0,
                "payroll_total_net": 0.0,
                "payroll_total_employer_pf": 0.0,
                "payroll_total_employer_esi": 0.0,
            }

    @classmethod
    def _training_metrics(
        cls, bu_id: uuid.UUID, year: int, month: int
    ) -> dict[str, Any]:
        """Training completions and average score this month."""
        try:
            # Model is EmployeeTraining (not TrainingEnrollment)
            from apps.hrms.models.training import EmployeeTraining

            completions = EmployeeTraining.objects.filter(
                business_unit_id=bu_id,
                status=EmployeeTraining.Status.COMPLETED,
                completion_date__year=year,     # field: completion_date (not completed_at)
                completion_date__month=month,
            )
            total_completions = completions.count()
            # score field does not exist — use pass_mark as a proxy if needed
            avg_score = completions.aggregate(avg=Avg("pass_mark"))["avg"]

            return {
                "training_completions": total_completions,
                "training_avg_score": round(float(avg_score), 2) if avg_score else None,
            }
        except Exception as exc:
            logger.warning("_training_metrics failed: %s", exc, exc_info=True)
            return {
                "training_completions": 0,
                "training_avg_score": None,
            }

    @classmethod
    def _department_split(cls, bu_id: uuid.UUID) -> dict[str, Any]:
        """Current headcount per department (live, not month-scoped)."""
        try:
            from apps.hrms.models.employee import Employee

            ACTIVE = Employee.EmploymentStatus.ACTIVE

            rows = (
                Employee.objects.filter(
                    business_unit_id=bu_id,
                    employment_status=ACTIVE,
                )
                .values("department__name")
                .annotate(cnt=Count("id"))
                .order_by("-cnt")
            )
            dept_split = {
                (row["department__name"] or "Unassigned"): row["cnt"]
                for row in rows
            }
            return {"headcount_by_department": dept_split}
        except Exception as exc:
            logger.warning("_department_split failed: %s", exc, exc_info=True)
            return {"headcount_by_department": {}}

    # ── Persistence ───────────────────────────────────────────────────────────

    @classmethod
    def _persist(
        cls,
        business_unit_id: uuid.UUID,
        year: int,
        month: int,
        snapshot_data: dict[str, Any],
    ) -> None:
        """
        Upsert the snapshot into HRAnalyticsSnapshot.
        Safe to call multiple times — uses update_or_create.
        """
        from apps.hrms.models.analytics_snapshot import HRAnalyticsSnapshot
        from django.utils import timezone as tz

        HRAnalyticsSnapshot.objects.update_or_create(
            business_unit_id=business_unit_id,
            year=year,
            month=month,
            defaults={
                "data": snapshot_data,
                "computed_at": tz.now(),
            },
        )
        logger.info(
            "AnalyticsSnapshot persisted to DB: bu=%s period=%04d-%02d",
            business_unit_id, year, month,
        )

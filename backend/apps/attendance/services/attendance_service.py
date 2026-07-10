# yss_orbit/backend/apps/attendance/attendance_service.py
"""
YSS Orbit — Attendance Service
Business logic for attendance tracking, check-in/out, regularization.
Refactored for B04 Compliance (SecurityContext) and Outbox Pattern.
"""
from __future__ import annotations

import uuid
import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import QuerySet, Sum, Count, Q
from django.utils import timezone

from apps.hrms.models import Shift, AttendanceRecord, AttendanceLog
from apps.iam.security_context import SecurityContext
from apps.platform.publisher import EventPublisher


class AttendanceService:
    """
    Service for attendance domain operations.
    All operations tenant-scoped via SecurityContext.
    """

    # ─── Shifts ──────────────────────────────────────────────────────────────

    def list_shifts(self, security_context: SecurityContext) -> QuerySet:
        bu_id = security_context.require_business_unit()
        return Shift.objects.filter(business_unit_id=bu_id).order_by("name")

    def get_shift(self, security_context: SecurityContext, shift_id: uuid.UUID) -> Shift:
        bu_id = security_context.require_business_unit()
        return Shift.objects.get(business_unit_id=bu_id, id=shift_id)

    def create_shift(self, security_context: SecurityContext, data: dict) -> Shift:
        bu_id = security_context.require_business_unit()
        data.pop("business_unit_id", None)
        data["created_by_id"] = security_context.effective_user_id
        return Shift.objects.create(business_unit_id=bu_id, **data)

    def update_shift(self, security_context: SecurityContext, shift_id: uuid.UUID, data: dict) -> Shift:
        bu_id = security_context.require_business_unit()
        shift = self.get_shift(security_context, shift_id)
        data.pop("business_unit_id", None)
        data["updated_by_id"] = security_context.effective_user_id
        for k, v in data.items():
            setattr(shift, k, v)
        shift.save()
        return shift

    # ─── Check-In / Check-Out ─────────────────────────────────────────────────

    @transaction.atomic
    def check_in(
        self,
        security_context: SecurityContext,
        employee_id: uuid.UUID,
        source: str = AttendanceRecord.Source.MOBILE,
        location: dict | None = None,
        device_id: str = "",
    ) -> AttendanceRecord:
        """Record employee check-in. Creates attendance record if not exists."""
        bu_id = security_context.require_business_unit()
        created_by_id = security_context.effective_user_id
        today = date.today()
        now = timezone.now()

        # Create punch log
        AttendanceLog.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            punch_time=now,
            punch_type=AttendanceLog.PunchType.IN,
            source=source,
            device_id=device_id,
            location=location,
            created_by_id=created_by_id,
        )

        # Get or create attendance record for today
        record, created = AttendanceRecord.objects.get_or_create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            date=today,
            defaults={
                "status": AttendanceRecord.AttendanceStatus.PRESENT,
                "source": source,
                "check_in": now,
                "created_by_id": created_by_id,
            },
        )

        if not created and record.check_in is None:
            record.check_in = now
            record.status = AttendanceRecord.AttendanceStatus.PRESENT
            record.source = source
            record.save(update_fields=["check_in", "status", "source", "updated_at"])

        EventPublisher.publish(
            event_type="attendance.check_in",
            aggregate_type="attendance.AttendanceRecord",
            aggregate_id=record.id,
            business_unit_id=bu_id,
            payload={"employee_id": str(employee_id), "check_in_time": now.isoformat(), "record_id": str(record.id)},
            correlation_id=security_context.correlation_id,
        )

        return record

    @transaction.atomic
    def check_out(
        self,
        security_context: SecurityContext,
        employee_id: uuid.UUID,
        location: dict | None = None,
        device_id: str = "",
    ) -> AttendanceRecord:
        """Record employee check-out. Computes working hours."""
        bu_id = security_context.require_business_unit()
        created_by_id = security_context.effective_user_id
        today = date.today()
        now = timezone.now()

        # Create punch log
        AttendanceLog.objects.create(
            business_unit_id=bu_id,
            employee_id=employee_id,
            punch_time=now,
            punch_type=AttendanceLog.PunchType.OUT,
            source=AttendanceRecord.Source.MOBILE,
            device_id=device_id,
            location=location,
            created_by_id=created_by_id,
        )

        try:
            record = AttendanceRecord.objects.get(
                business_unit_id=bu_id,
                employee_id=employee_id,
                date=today,
            )
        except AttendanceRecord.DoesNotExist:
            raise ValueError("No check-in found for today. Please check in first.")

        record.check_out = now

        # Compute working hours
        if record.check_in:
            duration = now - record.check_in
            hours = Decimal(str(round(duration.total_seconds() / 3600, 2)))
            record.working_hours = hours

            # Compute overtime if shift assigned
            if record.shift:
                std_hours = Decimal("8.00")  # default standard hours
                if hours > std_hours:
                    record.overtime_hours = hours - std_hours

        record.save(update_fields=["check_out", "working_hours", "overtime_hours", "updated_at"])

        EventPublisher.publish(
            event_type="attendance.check_out",
            aggregate_type="attendance.AttendanceRecord",
            aggregate_id=record.id,
            business_unit_id=bu_id,
            payload={
                "employee_id": str(employee_id),
                "check_out_time": now.isoformat(),
                "working_hours": float(record.working_hours) if record.working_hours else 0,
                "overtime_hours": float(record.overtime_hours) if record.overtime_hours else 0,
                "record_id": str(record.id)
            },
            correlation_id=security_context.correlation_id,
        )

        return record

    # ─── Attendance Records ───────────────────────────────────────────────────

    def get_attendance(self, security_context: SecurityContext, employee_id: uuid.UUID, date_: date) -> AttendanceRecord:
        bu_id = security_context.require_business_unit()
        return AttendanceRecord.objects.get(
            business_unit_id=bu_id, employee_id=employee_id, date=date_
        )

    def list_attendance(
        self,
        security_context: SecurityContext,
        employee_id: uuid.UUID | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
        status: str | None = None,
    ) -> QuerySet:
        bu_id = security_context.require_business_unit()
        qs = AttendanceRecord.objects.filter(business_unit_id=bu_id)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if from_date:
            qs = qs.filter(date__gte=from_date)
        if to_date:
            qs = qs.filter(date__lte=to_date)
        if status:
            qs = qs.filter(status=status)
        return qs.select_related("shift").order_by("-date")

    @transaction.atomic
    def regularize_attendance(
        self,
        security_context: SecurityContext,
        record_id: uuid.UUID,
        new_status: str,
        reason: str,
    ) -> AttendanceRecord:
        bu_id = security_context.require_business_unit()
        regularized_by_id = security_context.effective_user_id
        
        record = AttendanceRecord.objects.get(business_unit_id=bu_id, id=record_id)
        record.status = new_status
        record.is_regularized = True
        record.regularized_by_id = regularized_by_id
        record.regularization_reason = reason
        record.updated_by_id = regularized_by_id
        record.save(update_fields=[
            "status", "is_regularized", "regularized_by_id",
            "regularization_reason", "updated_by_id", "updated_at"
        ])
        
        EventPublisher.publish(
            event_type="attendance.regularized",
            aggregate_type="attendance.AttendanceRecord",
            aggregate_id=record.id,
            business_unit_id=bu_id,
            payload={
                "employee_id": str(record.employee_id),
                "record_id": str(record.id),
                "new_status": new_status,
                "reason": reason
            },
            correlation_id=security_context.correlation_id,
        )
        
        return record

    def get_monthly_summary(
        self,
        security_context: SecurityContext,
        employee_id: uuid.UUID,
        year: int,
        month: int,
    ) -> dict:
        """Compute monthly attendance summary for an employee."""
        bu_id = security_context.require_business_unit()
        _, days_in_month = calendar.monthrange(year, month)
        from_date = date(year, month, 1)
        to_date = date(year, month, days_in_month)

        records = AttendanceRecord.objects.filter(
            business_unit_id=bu_id,
            employee_id=employee_id,
            date__gte=from_date,
            date__lte=to_date,
        )

        aggregates = records.aggregate(
            total_working_hours=Sum("working_hours"),
            total_overtime_hours=Sum("overtime_hours"),
        )

        status_counts = {}
        for r in records:
            status_counts[r.status] = status_counts.get(r.status, 0) + 1

        return {
            "employee_id": str(employee_id),
            "year": year,
            "month": month,
            "total_days": days_in_month,
            "present_days": status_counts.get(AttendanceRecord.AttendanceStatus.PRESENT, 0),
            "absent_days": status_counts.get(AttendanceRecord.AttendanceStatus.ABSENT, 0),
            "half_days": status_counts.get(AttendanceRecord.AttendanceStatus.HALF_DAY, 0),
            "late_days": status_counts.get(AttendanceRecord.AttendanceStatus.LATE, 0),
            "leave_days": status_counts.get(AttendanceRecord.AttendanceStatus.LEAVE, 0),
            "holiday_days": status_counts.get(AttendanceRecord.AttendanceStatus.HOLIDAY, 0),
            "total_working_hours": aggregates["total_working_hours"] or Decimal("0.00"),
            "total_overtime_hours": aggregates["total_overtime_hours"] or Decimal("0.00"),
        }

    def list_logs(self, security_context: SecurityContext, employee_id: uuid.UUID, date_: date | None = None) -> QuerySet:
        bu_id = security_context.require_business_unit()
        qs = AttendanceLog.objects.filter(business_unit_id=bu_id, employee_id=employee_id)
        if date_:
            qs = qs.filter(punch_time__date=date_)
        return qs.order_by("punch_time")

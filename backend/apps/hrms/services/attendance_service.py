from datetime import date, datetime, timedelta
import uuid
from typing import Optional, Dict, Any
from django.db import transaction
from django.utils import timezone

from apps.hrms.models import Employee, Shift, AttendanceRecord, AttendancePunch
from apps.platform.core_exceptions import ValidationException

class AttendanceService:
    @staticmethod
    @transaction.atomic
    def record_punch(
        employee: Employee,
        source: str = AttendancePunch.Source.WEB,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        punch_time: Optional[datetime] = None
    ) -> AttendancePunch:
        if employee.employment_status not in [Employee.EmploymentStatus.ACTIVE, Employee.EmploymentStatus.NOTICE_PERIOD]:
            raise ValidationException(f"Cannot record attendance for employee with status {employee.employment_status}.")

        if not punch_time:
            punch_time = timezone.now()
            
        punch_date = punch_time.date()
        
        # Ensure there is an attendance record for the day
        record, created = AttendanceRecord.objects.get_or_create(
            business_unit_id=employee.business_unit_id,
            employee=employee,
            attendance_date=punch_date,
            defaults={
                'shift': employee.shift,
                'scheduled_in': employee.shift.start_time if employee.shift else None,
                'scheduled_out': employee.shift.end_time if employee.shift else None,
            }
        )
        
        if record.is_locked:
            raise ValidationException("Attendance for this day is locked and cannot be modified.")

        # Determine punch type based on previous punches
        last_punch = record.punches.order_by('-punch_time').first()
        punch_type = AttendancePunch.PunchType.IN
        
        if last_punch and last_punch.punch_type == AttendancePunch.PunchType.IN:
            punch_type = AttendancePunch.PunchType.OUT
            
        # Create the punch
        punch = AttendancePunch.objects.create(
            business_unit_id=employee.business_unit_id,
            record=record,
            punch_time=punch_time,
            punch_type=punch_type,
            source=source,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Update Record aggregates
        AttendanceService._recalculate_record(record)
        return punch

    @staticmethod
    def _recalculate_record(record: AttendanceRecord):
        punches = list(record.punches.order_by('punch_time'))
        if not punches:
            return
            
        first_in = next((p for p in punches if p.punch_type == AttendancePunch.PunchType.IN), None)
        last_out = next((p for p in reversed(punches) if p.punch_type == AttendancePunch.PunchType.OUT), None)
        
        if first_in:
            record.actual_in = first_in.punch_time
        if last_out:
            record.actual_out = last_out.punch_time
            
        # Calculate Work Hours
        total_seconds = 0
        in_punch = None
        for p in punches:
            if p.punch_type == AttendancePunch.PunchType.IN:
                in_punch = p
            elif p.punch_type == AttendancePunch.PunchType.OUT and in_punch:
                diff = p.punch_time - in_punch.punch_time
                total_seconds += diff.total_seconds()
                in_punch = None
                
        record.work_hours = total_seconds / 3600.0

        # Calculate Late / Early
        if record.shift and record.actual_in:
            scheduled_in_dt = timezone.make_aware(datetime.combine(record.attendance_date, record.shift.start_time))
            grace_dt = scheduled_in_dt + timedelta(minutes=record.shift.grace_time_minutes)
            
            if record.actual_in > grace_dt:
                late_diff = record.actual_in - scheduled_in_dt
                record.late_minutes = int(late_diff.total_seconds() / 60)
            else:
                record.late_minutes = 0

        # Determine Status
        status = AttendanceRecord.Status.ABSENT
        if record.actual_in and record.actual_out:
            if record.work_hours >= 4:  # simplistic rule for full/half day
                status = AttendanceRecord.Status.PRESENT
                if record.late_minutes > 0:
                    status = AttendanceRecord.Status.LATE
            else:
                status = AttendanceRecord.Status.HALF_DAY
        elif record.actual_in and not record.actual_out:
            status = AttendanceRecord.Status.MISSED_PUNCH
            
        # Check for Holidays and Leaves if the employee didn't work enough
        if status in [AttendanceRecord.Status.ABSENT, AttendanceRecord.Status.MISSED_PUNCH, AttendanceRecord.Status.HALF_DAY]:
            # 1. Check Leave
            from apps.hrms.models.leave_model import LeaveApplication
            has_leave = LeaveApplication.objects.filter(
                employee_id=record.employee_id,
                business_unit_id=record.business_unit_id,
                status=LeaveApplication.Status.APPROVED,
                start_date__lte=record.attendance_date,
                end_date__gte=record.attendance_date
            ).exists()
            
            if has_leave:
                status = AttendanceRecord.Status.ON_LEAVE
            else:
                # 2. Check Holiday
                from apps.hrms.models.holiday import Holiday
                has_holiday = Holiday.objects.filter(
                    calendar__business_unit_id=record.business_unit_id,
                    calendar__is_default=True,
                    date=record.attendance_date
                ).exists()
                
                if has_holiday:
                    # If they worked on a holiday, keep it PRESENT/LATE, but if they didn't, mark HOLIDAY
                    if status in [AttendanceRecord.Status.ABSENT, AttendanceRecord.Status.MISSED_PUNCH]:
                        status = AttendanceRecord.Status.HOLIDAY
                else:
                    # 3. Check Week Off (Simplistic: Saturday/Sunday)
                    if record.attendance_date.weekday() in [5, 6]:
                        if status in [AttendanceRecord.Status.ABSENT, AttendanceRecord.Status.MISSED_PUNCH]:
                            status = AttendanceRecord.Status.WEEK_OFF
                            
        record.status = status
        record.save()

    @staticmethod
    def get_summary(business_unit_id: uuid.UUID, start_date: date, end_date: date) -> Dict[str, Any]:
        records = AttendanceRecord.objects.filter(
            business_unit_id=business_unit_id,
            attendance_date__range=[start_date, end_date]
        )
        
        # Group by employee
        summary = {}
        for r in records:
            emp_id = str(r.employee_id)
            if emp_id not in summary:
                summary[emp_id] = {
                    'present_days': 0,
                    'absent_days': 0,
                    'late_days': 0,
                    'half_days': 0,
                    'missed_punches': 0,
                    'total_work_hours': 0.0,
                }
                
            s = summary[emp_id]
            if r.status == AttendanceRecord.Status.PRESENT:
                s['present_days'] += 1
            elif r.status == AttendanceRecord.Status.LATE:
                s['late_days'] += 1
                s['present_days'] += 1 # LATE implies PRESENT
            elif r.status == AttendanceRecord.Status.ABSENT:
                s['absent_days'] += 1
            elif r.status == AttendanceRecord.Status.HALF_DAY:
                s['half_days'] += 1
            elif r.status == AttendanceRecord.Status.MISSED_PUNCH:
                s['missed_punches'] += 1
                
            s['total_work_hours'] += float(r.work_hours)
            
        return summary

    @staticmethod
    @transaction.atomic
    def generate_missing_attendance_records(business_unit_id: uuid.UUID, target_date: date):
        """
        Generates missing attendance records for all active employees for a given date.
        Optimized with bulk_create to avoid N+1 queries.
        """
        existing_records_employee_ids = AttendanceRecord.objects.filter(
            business_unit_id=business_unit_id,
            attendance_date=target_date
        ).values_list('employee_id', flat=True)
        
        employees_without_records = Employee.objects.filter(
            business_unit_id=business_unit_id,
            employment_status=Employee.EmploymentStatus.ACTIVE
        ).exclude(id__in=existing_records_employee_ids).select_related('shift')
        
        if not employees_without_records.exists():
            return
            
        # Bulk Fetch Leaves
        from apps.hrms.models.leave_model import LeaveApplication
        leaves = set(LeaveApplication.objects.filter(
            business_unit_id=business_unit_id,
            status=LeaveApplication.Status.APPROVED,
            start_date__lte=target_date,
            end_date__gte=target_date,
            employee_id__in=[e.id for e in employees_without_records]
        ).values_list('employee_id', flat=True))
        
        # Bulk Fetch Holiday
        from apps.hrms.models.holiday import Holiday
        has_holiday = Holiday.objects.filter(
            calendar__business_unit_id=business_unit_id,
            calendar__is_default=True,
            date=target_date
        ).exists()
        
        new_records = []
        for employee in employees_without_records:
            status = AttendanceRecord.Status.ABSENT
            
            # Recalculate status in memory
            if employee.id in leaves:
                status = AttendanceRecord.Status.ON_LEAVE
            elif has_holiday:
                status = AttendanceRecord.Status.HOLIDAY
            else:
                work_days = employee.shift.work_days if employee.shift and employee.shift.work_days else [0, 1, 2, 3, 4]
                if target_date.weekday() not in work_days:
                    status = AttendanceRecord.Status.WEEK_OFF
                    
            record = AttendanceRecord(
                business_unit_id=business_unit_id,
                employee=employee,
                attendance_date=target_date,
                shift=employee.shift,
                scheduled_in=employee.shift.start_time if employee.shift else None,
                scheduled_out=employee.shift.end_time if employee.shift else None,
                status=status
            )
            new_records.append(record)
            
        if new_records:
            AttendanceRecord.objects.bulk_create(new_records)

    @staticmethod
    @transaction.atomic
    def lock_attendance(business_unit_id: uuid.UUID, start_date: date, end_date: date, locked_by_id: uuid.UUID) -> int:
        """
        Locks attendance records for a specific date range (typically a payroll cycle).
        Once locked, records cannot be modified via punch or correction requests.
        """
        records = AttendanceRecord.objects.filter(
            business_unit_id=business_unit_id,
            attendance_date__gte=start_date,
            attendance_date__lte=end_date,
            is_locked=False
        )
        
        count = records.update(
            is_locked=True,
            locked_at=timezone.now(),
            locked_by_user_id=locked_by_id
        )
        
        return count



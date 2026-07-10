from django.db import models
from apps.platform.models.base import TenantModel

class AttendanceRecord(TenantModel):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        HALF_DAY = 'HALF_DAY', 'Half Day'
        ON_LEAVE = 'ON_LEAVE', 'On Leave'
        PAID_LEAVE = 'PAID_LEAVE', 'Paid Leave'
        UNPAID_LEAVE = 'UNPAID_LEAVE', 'Unpaid Leave'
        HALF_DAY_LEAVE = 'HALF_DAY_LEAVE', 'Half Day Leave'
        HOLIDAY = 'HOLIDAY', 'Holiday'
        WEEK_OFF = 'WEEK_OFF', 'Week Off'
        LATE = 'LATE', 'Late'
        EARLY_OUT = 'EARLY_OUT', 'Early Out'
        MISSED_PUNCH = 'MISSED_PUNCH', 'Missed Punch'
        WORK_FROM_HOME = 'WORK_FROM_HOME', 'Work From Home'
        ON_DUTY = 'ON_DUTY', 'On Duty'

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='attendance_records')
    attendance_date = models.DateField()
    
    shift = models.ForeignKey('hrms.Shift', on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_in = models.TimeField(null=True, blank=True)
    scheduled_out = models.TimeField(null=True, blank=True)
    
    actual_in = models.DateTimeField(null=True, blank=True)
    actual_out = models.DateTimeField(null=True, blank=True)
    
    work_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    late_minutes = models.IntegerField(default=0)
    early_out_minutes = models.IntegerField(default=0)
    overtime_minutes = models.IntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABSENT)
    remarks = models.TextField(blank=True)
    
    # DDD Compliance: Soft link to IAM Domain
    approved_by_user_id = models.UUIDField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Payroll Protection (Attendance Locking)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by_user_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        unique_together = ('business_unit_id', 'employee', 'attendance_date')
        indexes = [
            models.Index(fields=["business_unit_id", "attendance_date"]),
            models.Index(fields=["business_unit_id", "employee_id"]),
            models.Index(fields=["business_unit_id", "status"]),
            models.Index(fields=["business_unit_id", "shift_id"]),
        ]

    def __str__(self):
        return f"{self.employee.employee_code} - {self.attendance_date} ({self.status})"

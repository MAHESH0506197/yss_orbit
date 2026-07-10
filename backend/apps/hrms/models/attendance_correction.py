from django.db import models
from apps.platform.models.base import TenantModel

class AttendanceCorrectionRequest(TenantModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    class RequestType(models.TextChoices):
        MISSED_IN = 'MISSED_IN', 'Missed Punch In'
        MISSED_OUT = 'MISSED_OUT', 'Missed Punch Out'
        WRONG_TIME = 'WRONG_TIME', 'Wrong Time'
        FULL_DAY_CORRECTION = 'FULL_DAY_CORRECTION', 'Full Day Correction'

    employee = models.ForeignKey('hrms.Employee', on_delete=models.CASCADE, related_name='attendance_corrections')
    record = models.ForeignKey('hrms.AttendanceRecord', on_delete=models.CASCADE, related_name='correction_requests')
    
    request_type = models.CharField(max_length=30, choices=RequestType.choices, default=RequestType.WRONG_TIME)
    
    requested_in_time = models.DateTimeField(null=True, blank=True)
    requested_out_time = models.DateTimeField(null=True, blank=True)
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # DDD Compliance
    approved_by_user_id = models.UUIDField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Correction for {self.employee.employee_code} - {self.record.attendance_date}"

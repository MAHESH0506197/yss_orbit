from django.db import models
from apps.platform.models.base import TenantModel
from .leave_type import LeaveType


class LeaveRequest(TenantModel):
    """
    Handles employee leave applications.
    """
    class SessionChoices(models.TextChoices):
        FULL_DAY = "FULL_DAY", "Full Day"
        FIRST_HALF = "FIRST_HALF", "First Half"
        SECOND_HALF = "SECOND_HALF", "Second Half"
        
    class StatusChoices(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        MANAGER_APPROVED = "MANAGER_APPROVED", "Manager Approved"
        HR_APPROVED = "HR_APPROVED", "HR Approved"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        CANCELLATION_REQUESTED = "CANCELLATION_REQUESTED", "Cancellation Requested"

    employee = models.ForeignKey("hrms.Employee", on_delete=models.CASCADE, related_name="leave_requests")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, related_name="requests")
    
    start_date = models.DateField()
    end_date = models.DateField()
    session = models.CharField(max_length=20, choices=SessionChoices.choices, default=SessionChoices.FULL_DAY)
    
    status = models.CharField(max_length=30, choices=StatusChoices.choices, default=StatusChoices.DRAFT)
    reason = models.TextField()
    
    manager_approved_by = models.ForeignKey("hrms.Employee", null=True, blank=True, on_delete=models.SET_NULL, related_name="manager_approved_leaves")
    manager_comments = models.TextField(blank=True)
    
    hr_approved_by = models.ForeignKey("hrms.Employee", null=True, blank=True, on_delete=models.SET_NULL, related_name="hr_approved_leaves")
    hr_comments = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_requests"
        indexes = [
            models.Index(fields=['business_unit_id', 'status'], name='leave_req_bu_status_idx'),
            models.Index(fields=['business_unit_id', 'employee_id'], name='leave_req_bu_emp_idx'),
            models.Index(fields=['business_unit_id', 'start_date'], name='leave_req_bu_start_idx'),
        ]

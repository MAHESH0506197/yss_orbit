from django.db import models
from apps.platform.models.base import TenantModel
from .leave_request import LeaveRequest


class LeaveRequestHistory(TenantModel):
    """
    Audit trail for leave requests.
    """
    leave_request = models.ForeignKey(LeaveRequest, on_delete=models.CASCADE, related_name="history")
    status = models.CharField(max_length=30)
    changed_by = models.ForeignKey("hrms.Employee", null=True, blank=True, on_delete=models.SET_NULL, related_name="leave_history_changes")
    remarks = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_request_history"
        verbose_name_plural = "Leave Request Histories"

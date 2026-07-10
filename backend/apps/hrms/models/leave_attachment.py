from django.db import models
from apps.platform.models.base import TenantModel
from .leave_request import LeaveRequest


class LeaveAttachment(TenantModel):
    """
    Stores files supporting a Leave Request.
    """
    leave_request = models.ForeignKey(LeaveRequest, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="leave_attachments/")
    uploaded_by = models.ForeignKey("hrms.Employee", null=True, blank=True, on_delete=models.SET_NULL, related_name="uploaded_leave_attachments")

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_attachments"

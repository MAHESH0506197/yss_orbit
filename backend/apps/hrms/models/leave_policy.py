from django.db import models
from apps.platform.models.base import TenantModel


class LeavePolicy(TenantModel):
    """
    Defines standard leave policies.
    """
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_policies"
        verbose_name_plural = "Leave Policies"


class LeavePolicyAssignment(TenantModel):
    """
    Assigns a LeavePolicy to a Business Unit or Employee Group.
    """
    policy = models.ForeignKey(LeavePolicy, on_delete=models.CASCADE, related_name="assignments")
    # business_unit_id is already in TenantModel
    # Add employee_group later if needed

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_policy_assignments"

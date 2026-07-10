from django.db import models
from apps.platform.models.base import TenantModel


class LeaveRestrictionWindow(TenantModel):
    """
    Blackout dates where leave is restricted.
    """
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_restriction_windows"

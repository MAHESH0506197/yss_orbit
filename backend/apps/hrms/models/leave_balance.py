from decimal import Decimal
from django.db import models
from apps.platform.models.base import TenantModel
from .leave_type import LeaveType


class LeaveBalance(TenantModel):
    """
    Tracks the current balance for an employee.
    closing_balance = opening + accrued + adjusted - consumed - encashed
    """
    employee = models.ForeignKey("hrms.Employee", on_delete=models.CASCADE, related_name="leave_balances")
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name="balances")
    year = models.PositiveIntegerField()
    
    opening_balance = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    accrued_days = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    consumed_days = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    adjusted_days = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    encashed_days = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    closing_balance = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_balances"
        unique_together = [("employee", "leave_type", "year")]

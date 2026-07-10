# yss_orbit/backend/apps/hrms/models/cost_center.py
from django.db import models
from apps.platform.models.base import TenantModel


class CostCenter(TenantModel):
    """
    Cost Center / Profit Center hierarchy.

    Used for payroll cost allocation, finance reporting, and project accounting.
    Supports hierarchical cost centers (parent-child) via self-referencing FK.
    Employees can be split-allocated across multiple cost centers.

    Finance integration: Each payslip's cost is allocated proportionally
    to the employee's active CostAllocation records.
    """

    class CenterType(models.TextChoices):
        COST       = 'COST',       'Cost Center'
        PROFIT     = 'PROFIT',     'Profit Center'
        INVESTMENT = 'INVESTMENT', 'Investment Center'
        SUPPORT    = 'SUPPORT',    'Support Center'

    name        = models.CharField(max_length=200)
    code        = models.CharField(max_length=30, db_index=True)
    center_type = models.CharField(max_length=15, choices=CenterType.choices, default=CenterType.COST)
    parent      = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='children'
    )
    department_id  = models.UUIDField(null=True, blank=True, db_index=True)  # Soft FK to hrms.Department
    description    = models.TextField(blank=True)
    is_active      = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_cost_centers'
        unique_together = [('business_unit_id', 'code')]
        ordering = ['code']

    def __str__(self) -> str:
        return f"{self.code} — {self.name} ({self.center_type})"


class EmployeeCostAllocation(TenantModel):
    """
    Maps an employee to one or more cost centers with percentage allocation.

    Rules:
    - Total allocation_percentage across all ACTIVE records for an employee
      on any given date must equal 100%.
    - Validated by CostAllocationService before save.
    - When an employee moves (transfer), old allocation is end-dated and
      a new one is created.

    Finance use: Payroll service queries active allocations and splits
    payslip cost proportionally across cost centers.
    """

    class BillingCategory(models.TextChoices):
        BILLABLE     = 'BILLABLE',     'Billable'
        NON_BILLABLE = 'NON_BILLABLE', 'Non-Billable'
        OVERHEAD     = 'OVERHEAD',     'Overhead'
        INTERNAL     = 'INTERNAL',     'Internal'

    employee_id          = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    cost_center          = models.ForeignKey(CostCenter, on_delete=models.PROTECT, related_name='allocations')
    project_code         = models.CharField(max_length=50, blank=True)
    billing_category     = models.CharField(max_length=15, choices=BillingCategory.choices, default=BillingCategory.NON_BILLABLE)
    allocation_percentage = models.DecimalField(max_digits=5, decimal_places=2)  # e.g. 60.00 for 60%
    effective_from       = models.DateField(db_index=True)
    effective_to         = models.DateField(null=True, blank=True, db_index=True)
    is_primary           = models.BooleanField(default=True)
    notes                = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_cost_allocations'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'effective_from']),
            models.Index(fields=['business_unit_id', 'cost_center_id']),
        ]

    def __str__(self) -> str:
        return (
            f"{self.employee_id} → {self.cost_center.code}: "
            f"{self.allocation_percentage}% [{self.effective_from} to {self.effective_to or 'present'}]"
        )

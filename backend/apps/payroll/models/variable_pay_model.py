from django.db import models
from apps.platform.models.base import TenantModel


class VariablePayPlan(TenantModel):
    """
    Defines a variable pay (bonus) plan. Can be performance-linked or fixed.
    Used during payroll to inject variable pay into the payslip for a given period.
    """

    class PlanType(models.TextChoices):
        QUARTERLY = 'QUARTERLY', 'Quarterly'
        ANNUAL = 'ANNUAL', 'Annual'
        PROJECT = 'PROJECT', 'Project-Based'
        AD_HOC = 'AD_HOC', 'Ad-Hoc'

    class CalculationMethod(models.TextChoices):
        FIXED_AMOUNT = 'FIXED_AMOUNT', 'Fixed Amount'
        PCT_OF_CTC = 'PCT_OF_CTC', '% of Annual CTC'
        PCT_OF_BASIC = 'PCT_OF_BASIC', '% of Basic Salary'
        PERFORMANCE_LINKED = 'PERFORMANCE_LINKED', 'Performance Rating Linked'

    name = models.CharField(max_length=200)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices)
    calculation_method = models.CharField(
        max_length=25, choices=CalculationMethod.choices
    )
    value = models.DecimalField(
        max_digits=12, decimal_places=2
    )  # Fixed amount or percentage
    # For PERFORMANCE_LINKED: maps rating (str) to multiplier (float)
    # e.g. {"5": 1.5, "4": 1.0, "3": 0.5}
    performance_matrix = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_variable_pay_plans'

    def __str__(self):
        return f"{self.name} ({self.plan_type} / {self.calculation_method})"


class EmployeeVariablePay(TenantModel):
    """
    Actual variable pay award for a specific employee for a specific period.
    When status=APPROVED and payment_month is set, payroll engine injects it
    into that month's payslip.
    """

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        APPROVED = 'APPROVED', 'Approved'
        PAID = 'PAID', 'Paid'

    employee_id = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    plan = models.ForeignKey(
        VariablePayPlan,
        on_delete=models.PROTECT,
        related_name='awards',
    )
    period_label = models.CharField(max_length=20)  # e.g. 'Q1-2025', 'Annual-2024'
    performance_rating = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True
    )
    calculated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.DRAFT
    )
    payment_month = models.DateField(
        null=True, blank=True
    )  # Month payslip it will be injected into
    approved_by_id = models.UUIDField(
        null=True, blank=True
    )  # Soft FK to iam.User
    paid_payslip_id = models.UUIDField(
        null=True, blank=True
    )  # Soft FK to payroll.Payslip

    class Meta(TenantModel.Meta):
        db_table = 'payroll_employee_variable_pay'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'status']),
        ]

    def __str__(self):
        return (
            f"Variable Pay: {self.employee_id} {self.period_label} "
            f"= ₹{self.approved_amount} [{self.status}]"
        )


class RetentionBonus(TenantModel):
    """
    Retention bonus with service cliff vesting.
    If the employee leaves before vesting_date or before completing
    service_condition_months, the bonus is forfeited.
    Used in Final Settlement calculation.
    """

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        VESTED = 'VESTED', 'Vested'
        FORFEITED = 'FORFEITED', 'Forfeited'

    employee_id = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    vesting_date = models.DateField()
    service_condition_months = models.IntegerField()  # Must remain employed from grant date
    grant_date = models.DateField()
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE
    )
    forfeited_at = models.DateTimeField(null=True, blank=True)
    vested_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'payroll_retention_bonus'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'status']),
            models.Index(fields=['business_unit_id', 'vesting_date']),
        ]

    def __str__(self):
        return (
            f"Retention Bonus: {self.employee_id} ₹{self.total_amount} "
            f"vests {self.vesting_date} [{self.status}]"
        )

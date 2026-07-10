from decimal import Decimal
from django.db import models
from apps.platform.models.base import TenantModel
from .leave_policy import LeavePolicy


class LeaveType(TenantModel):
    """
    Defines the types of leaves available under a policy.
    Supports advanced enterprise rules: sandwich leave, gender restriction,
    compensatory off, leave donation, and leave encashment.
    """
    policy = models.ForeignKey(LeavePolicy, on_delete=models.CASCADE, related_name="leave_types")
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=150)

    # Core Attributes
    is_paid = models.BooleanField(default=True)
    is_lop = models.BooleanField(default=False)

    # Workflow
    requires_approval = models.BooleanField(default=True)
    requires_manager_approval = models.BooleanField(default=True)
    requires_hr_approval = models.BooleanField(default=False)

    # Attachments
    requires_attachment = models.BooleanField(default=False)
    attachment_after_days = models.PositiveIntegerField(default=2)

    # Rules
    allow_half_day = models.BooleanField(default=False)
    allow_negative_balance = models.BooleanField(default=False)
    allow_carry_forward = models.BooleanField(default=False)
    max_carry_forward = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    accrual_rate_per_month = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    max_days_per_request = models.PositiveIntegerField(default=30)
    min_notice_days = models.PositiveIntegerField(default=0)

    # Exclusions
    exclude_weekends = models.BooleanField(default=True)
    exclude_holidays = models.BooleanField(default=True)

    # ── Sandwich Leave Rule ──────────────────────────────────────────────────
    # If True, weekends/holidays sandwiched between leave days are counted.
    # Example: Leave Fri–Mon with sandwich=True counts as 4 days, not 2.
    include_weekends_between = models.BooleanField(default=False)
    include_holidays_between = models.BooleanField(default=False)

    # ── Probation Restriction ────────────────────────────────────────────────
    allowed_during_probation = models.BooleanField(default=True)

    # ── Gender-Based Eligibility ─────────────────────────────────────────────
    # E.g., Maternity Leave is only available to female employees.
    gender_restricted = models.BooleanField(default=False)
    gender_allowed = models.CharField(
        max_length=1, blank=True,
        help_text="M=Male, F=Female, O=Other. Only enforced if gender_restricted=True."
    )

    # ── Compensatory Off ─────────────────────────────────────────────────────
    is_compensatory = models.BooleanField(default=False)
    comp_off_expiry_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Days after which comp-off balance expires. Null = no expiry."
    )

    # ── Leave Donation ────────────────────────────────────────────────────────
    allows_donation = models.BooleanField(default=False)
    max_donate_days = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Max days an employee can donate per year."
    )

    # ── Leave Encashment ──────────────────────────────────────────────────────
    allows_encashment = models.BooleanField(default=False)
    encashment_rate_type = models.CharField(
        max_length=10, blank=True,
        choices=[('BASIC', 'Basic Salary'), ('GROSS', 'Gross Salary')],
        default='BASIC',
        help_text="Whether encashment is calculated on Basic or Gross salary."
    )
    max_encash_days_per_year = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Max leave days that can be encashed per financial year."
    )

    # UI
    color = models.CharField(max_length=20, default="#000000")
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = "hrms_leave_types"
        unique_together = [("policy", "code")]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"

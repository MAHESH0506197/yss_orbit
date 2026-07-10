# yss_orbit/backend/apps/hrms/models/lifecycle.py
"""
Employee Lifecycle Models — Transfer, Promotion, Salary Revision, Exit, Final Settlement.

These models capture formal HR actions that change the employee's career trajectory.
Each creates an EmployeeEvent on completion for the 360 Timeline.

Design notes:
- All models use soft FK (UUIDField) to hrms.Employee for DDD compliance.
- Approval flows are kept simple: PENDING → APPROVED → CANCELLED.
  The actual state change (dept change, CTC update) is applied by the service
  on APPROVED transition.
- FinalSettlement references ExitRequest but never directly queries payroll models —
  it receives pre-computed figures from PayrollService via service layer.
"""
from django.db import models
from django.utils import timezone
from apps.platform.models.base import TenantModel


class EmployeeTransfer(TenantModel):
    """
    Records a formal employee transfer between departments, locations, or business units.
    On approval, updates Employee.department, Employee.reporting_manager_id, etc.
    """

    class Status(models.TextChoices):
        DRAFT     = 'DRAFT',     'Draft'
        PENDING   = 'PENDING',   'Pending Approval'
        APPROVED  = 'APPROVED',  'Approved'
        REJECTED  = 'REJECTED',  'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee_id         = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee

    # From (captured at creation time for audit)
    from_department_id  = models.UUIDField(null=True, blank=True)
    from_designation_id = models.UUIDField(null=True, blank=True)
    from_location       = models.CharField(max_length=200, blank=True)
    from_manager_id     = models.UUIDField(null=True, blank=True)
    from_shift_id       = models.UUIDField(null=True, blank=True)

    # To (target state)
    to_department_id    = models.UUIDField(null=True, blank=True)
    to_designation_id   = models.UUIDField(null=True, blank=True)
    to_location         = models.CharField(max_length=200, blank=True)
    to_manager_id       = models.UUIDField(null=True, blank=True)
    to_shift_id         = models.UUIDField(null=True, blank=True)

    effective_date      = models.DateField()
    reason              = models.TextField()
    transfer_letter_id  = models.UUIDField(null=True, blank=True)  # Soft FK to file_storage.FileAsset

    status              = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT, db_index=True)
    initiated_by_id     = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User (HR/Manager)
    approved_by_id      = models.UUIDField(null=True, blank=True)
    approved_at         = models.DateTimeField(null=True, blank=True)
    remarks             = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_transfers'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'effective_date']),
            models.Index(fields=['business_unit_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Transfer: {self.employee_id} → {self.to_department_id} on {self.effective_date} [{self.status}]"


class EmployeePromotion(TenantModel):
    """
    Records a formal promotion — change in designation, grade, and optionally CTC.
    On approval: updates Employee.designation_id, Employee.ctc, Employee.basic_salary
    and creates a SalaryRevision if increment_amount > 0.
    """

    class Status(models.TextChoices):
        DRAFT     = 'DRAFT',     'Draft'
        PENDING   = 'PENDING',   'Pending Approval'
        APPROVED  = 'APPROVED',  'Approved'
        REJECTED  = 'REJECTED',  'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee_id             = models.UUIDField(db_index=True)
    from_designation_id     = models.UUIDField(null=True, blank=True)
    to_designation_id       = models.UUIDField(null=True, blank=True)
    effective_date          = models.DateField()
    increment_amount        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    increment_percentage    = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    new_ctc                 = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reason                  = models.TextField()
    promotion_letter_id     = models.UUIDField(null=True, blank=True)

    status                  = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT, db_index=True)
    recommended_by_id       = models.UUIDField(null=True, blank=True)  # Manager
    approved_by_id          = models.UUIDField(null=True, blank=True)  # HR
    approved_at             = models.DateTimeField(null=True, blank=True)
    remarks                 = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_promotions'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'effective_date']),
            models.Index(fields=['business_unit_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Promotion: {self.employee_id} on {self.effective_date} [{self.status}]"


class SalaryRevision(TenantModel):
    """
    Records any change to an employee's CTC or basic salary.
    Created automatically by EmployeePromotion service or manually by HR.
    Each revision is a permanent audit record — salaries are never edited in-place.
    """

    class RevisionType(models.TextChoices):
        ANNUAL_INCREMENT  = 'ANNUAL_INCREMENT',  'Annual Increment'
        PROMOTION         = 'PROMOTION',         'Promotion'
        MARKET_CORRECTION = 'MARKET_CORRECTION', 'Market Correction'
        PERFORMANCE       = 'PERFORMANCE',       'Performance Bonus Revision'
        PROBATION_END     = 'PROBATION_END',     'Probation Confirmation'
        MANUAL            = 'MANUAL',            'Manual Adjustment'

    employee_id       = models.UUIDField(db_index=True)
    revision_type     = models.CharField(max_length=20, choices=RevisionType.choices)
    effective_date    = models.DateField(db_index=True)

    old_ctc           = models.DecimalField(max_digits=12, decimal_places=2)
    new_ctc           = models.DecimalField(max_digits=12, decimal_places=2)
    old_basic         = models.DecimalField(max_digits=12, decimal_places=2)
    new_basic         = models.DecimalField(max_digits=12, decimal_places=2)
    increment_amount  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    increment_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    reference_id      = models.UUIDField(null=True, blank=True)  # FK to Promotion or Appraisal
    notes             = models.TextField(blank=True)
    approved_by_id    = models.UUIDField(null=True, blank=True)
    approved_at       = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_salary_revisions'
        ordering = ['-effective_date']
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', '-effective_date']),
        ]

    def __str__(self) -> str:
        return (
            f"Salary Revision [{self.revision_type}]: {self.employee_id} "
            f"CTC {self.old_ctc} → {self.new_ctc} from {self.effective_date}"
        )


class ExitRequest(TenantModel):
    """
    Formal employee exit/resignation record.
    Drives the exit workflow: resignation → notice period → last working day → settlement.

    On approval: Employee.employment_status set to NOTICE_PERIOD.
    On exit completion: Employee.employment_status set to RESIGNED/TERMINATED + date_of_leaving populated.
    """

    class ExitType(models.TextChoices):
        RESIGNATION  = 'RESIGNATION',  'Voluntary Resignation'
        TERMINATION  = 'TERMINATION',  'Termination'
        RETIREMENT   = 'RETIREMENT',   'Retirement'
        CONTRACT_END = 'CONTRACT_END', 'Contract End'
        ABANDONMENT  = 'ABANDONMENT',  'Abandonment'

    class Status(models.TextChoices):
        SUBMITTED      = 'SUBMITTED',      'Submitted'
        MANAGER_REVIEW = 'MANAGER_REVIEW', 'Under Manager Review'
        HR_REVIEW      = 'HR_REVIEW',      'Under HR Review'
        NOTICE_PERIOD  = 'NOTICE_PERIOD',  'Serving Notice Period'
        APPROVED       = 'APPROVED',       'Exit Approved'
        WITHDRAWN      = 'WITHDRAWN',      'Withdrawn by Employee'
        CANCELLED      = 'CANCELLED',      'Cancelled by HR'

    employee_id        = models.UUIDField(db_index=True)
    exit_type          = models.CharField(max_length=15, choices=ExitType.choices, default=ExitType.RESIGNATION)
    status             = models.CharField(max_length=15, choices=Status.choices, default=Status.SUBMITTED, db_index=True)

    resignation_date   = models.DateField()
    notice_period_days = models.IntegerField(default=30)
    last_working_date  = models.DateField(null=True, blank=True)  # Calculated or overridden by HR
    actual_last_day    = models.DateField(null=True, blank=True)

    reason             = models.TextField()
    reason_category    = models.CharField(max_length=50, blank=True)  # BETTER_OPPORTUNITY | PERSONAL | etc.
    exit_interview_done = models.BooleanField(default=False)

    approved_by_id     = models.UUIDField(null=True, blank=True)
    approved_at        = models.DateTimeField(null=True, blank=True)
    hr_remarks         = models.TextField(blank=True)
    rehire_eligible    = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_exit_requests'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'status']),
            models.Index(fields=['business_unit_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Exit [{self.exit_type}]: {self.employee_id} — LWD {self.last_working_date} [{self.status}]"


class FinalSettlement(TenantModel):
    """
    Final Settlement calculation after exit.
    Captures all payable and recoverable amounts for the exiting employee.

    Computed by FinalSettlementService. Approved by Finance.
    Payment processed via the final payroll run for the month.
    """

    class Status(models.TextChoices):
        DRAFT    = 'DRAFT',    'Draft'
        COMPUTED = 'COMPUTED', 'Computed'
        APPROVED = 'APPROVED', 'Approved'
        PAID     = 'PAID',     'Paid'
        DISPUTED = 'DISPUTED', 'Disputed'

    employee_id     = models.UUIDField(db_index=True)
    exit_request    = models.OneToOneField(ExitRequest, on_delete=models.PROTECT, related_name='settlement')
    settlement_date = models.DateField(null=True, blank=True)
    status          = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True)

    # Payables to employee
    salary_for_last_month = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Pro-rated
    earned_leave_encashment = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gratuity_amount       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bonus_amount          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lta_balance           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_payables        = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Recoveries from employee
    notice_period_shortfall_days = models.IntegerField(default=0)
    notice_recovery_amount       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_recovery             = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    asset_recovery               = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_recoveries             = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Net
    total_payable    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_recovery   = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount       = models.DecimalField(max_digits=12, decimal_places=2, default=0)   # payable - recovery
    tds_on_gratuity  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tds_on_leave_enc = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    computation_notes = models.TextField(blank=True)
    approved_by_id    = models.UUIDField(null=True, blank=True)
    approved_at       = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_final_settlements'

    def __str__(self) -> str:
        return f"Final Settlement: {self.employee_id} Net={self.net_amount} [{self.status}]"

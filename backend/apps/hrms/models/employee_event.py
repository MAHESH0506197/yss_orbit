# yss_orbit/backend/apps/hrms/models/employee_event.py
from django.db import models
from apps.platform.models.base import TenantModel


class EmployeeEvent(TenantModel):
    """
    Immutable, append-only audit-grade event log for the Employee 360 Timeline.

    Every significant employee lifecycle action publishes an event here via
    EmployeeEventPublisher. The Employee 360 Timeline tab reads exclusively from
    this model — no manual timeline population is needed.

    Design notes:
    - Records are NEVER updated or deleted once created (append-only).
    - `metadata` is a flexible JSONField for event-specific context data
      (e.g., from_dept/to_dept for transfers, old_ctc/new_ctc for salary revisions).
    - `triggered_by_id` is a soft FK to iam.User (not hrms.Employee) because
      system tasks (Celery) may trigger events with no user context.
    """

    class EventType(models.TextChoices):
        # Joining & Onboarding
        HIRED               = 'HIRED',               'Hired'
        JOINED              = 'JOINED',              'Joined'
        PREBOARDING_STARTED = 'PREBOARDING_STARTED', 'Pre-boarding Started'
        ONBOARDING_STARTED  = 'ONBOARDING_STARTED',  'Onboarding Started'
        ONBOARDING_DONE     = 'ONBOARDING_DONE',     'Onboarding Completed'
        PROBATION_STARTED   = 'PROBATION_STARTED',   'Probation Started'
        CONFIRMED           = 'CONFIRMED',           'Probation Confirmed'

        # Structural changes
        TRANSFERRED         = 'TRANSFERRED',         'Transferred'
        PROMOTED            = 'PROMOTED',            'Promoted'
        DESIGNATION_CHANGED = 'DESIGNATION_CHANGED', 'Designation Changed'
        DEPT_CHANGED        = 'DEPT_CHANGED',        'Department Changed'
        SHIFT_CHANGED       = 'SHIFT_CHANGED',       'Shift Changed'
        REPORTING_CHANGED   = 'REPORTING_CHANGED',   'Reporting Manager Changed'
        COST_CENTER_CHANGED = 'COST_CENTER_CHANGED', 'Cost Center Changed'

        # Compensation
        SALARY_REVISED      = 'SALARY_REVISED',      'Salary Revised'
        VARIABLE_PAY_PAID   = 'VARIABLE_PAY_PAID',   'Variable Pay Disbursed'
        RETENTION_VESTED    = 'RETENTION_VESTED',     'Retention Bonus Vested'
        PAYROLL_PROCESSED   = 'PAYROLL_PROCESSED',   'Payroll Processed'

        # Assets
        ASSET_ASSIGNED      = 'ASSET_ASSIGNED',      'Asset Assigned'
        ASSET_RETURNED      = 'ASSET_RETURNED',      'Asset Returned'

        # Leave
        LEAVE_APPROVED      = 'LEAVE_APPROVED',      'Leave Approved'

        # Training & Development
        TRAINING_ENROLLED   = 'TRAINING_ENROLLED',   'Training Enrolled'
        TRAINING_COMPLETED  = 'TRAINING_COMPLETED',  'Training Completed'
        CERTIFICATION_EARNED = 'CERTIFICATION_EARNED', 'Certification Earned'

        # Performance
        APPRAISAL_COMPLETED = 'APPRAISAL_COMPLETED', 'Appraisal Completed'
        GOAL_SET            = 'GOAL_SET',            'Goals Set'

        # Exit
        EXIT_INITIATED      = 'EXIT_INITIATED',      'Exit Initiated'
        NOTICE_PERIOD_START = 'NOTICE_PERIOD_START', 'Notice Period Started'
        EXIT_COMPLETED      = 'EXIT_COMPLETED',      'Exit Completed'
        SETTLEMENT_DONE     = 'SETTLEMENT_DONE',     'Final Settlement Completed'

        # Re-hire
        REHIRED             = 'REHIRED',             'Re-Hired'

    employee_id     = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    event_type      = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    event_date      = models.DateField(db_index=True, auto_now_add=False, null=True, blank=True)
    title           = models.CharField(max_length=255)   # Required: one-line summary for Timeline
    description     = models.TextField(blank=True)        # Optional detail

    # Flexible metadata per event type
    metadata        = models.JSONField(default=dict, blank=True)

    triggered_by_id = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User (None = system)
    reference_id    = models.UUIDField(null=True, blank=True)   # Soft FK to the source record

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_events'
        ordering = ['-event_date', '-created_at']
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', '-event_date']),
            models.Index(fields=['business_unit_id', 'event_type']),
        ]

    def __str__(self) -> str:
        return f"[{self.event_date}] {self.employee_id}: {self.event_type} — {self.title}"

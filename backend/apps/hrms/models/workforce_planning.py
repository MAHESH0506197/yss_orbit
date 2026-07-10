# yss_orbit/backend/apps/hrms/models/workforce_planning.py
"""
Workforce Planning Module.

Ensures Recruitment originates from approved, budgeted headcount positions.
This prevents unauthorized hiring and links job postings to budget approvals.

Future integration: ManpowerRequest.job_posting_id links to recruitment.JobPosting
when the request is approved.
"""
from django.db import models
from apps.platform.models.base import TenantModel


class Position(TenantModel):
    """
    A budgeted organizational position.

    Represents a role slot in the org structure, not a specific person.
    Positions define the headcount budget per department.
    When current_headcount < max_headcount, the position is open for recruitment.

    HR creates positions; Finance approves budget allocation.
    Recruitment always links to an approved Position via ManpowerRequest.
    """

    class PositionType(models.TextChoices):
        PERMANENT   = 'PERMANENT',   'Permanent'
        CONTRACT    = 'CONTRACT',    'Contract'
        INTERN      = 'INTERN',      'Intern'
        CONSULTANT  = 'CONSULTANT',  'Consultant'
        PART_TIME   = 'PART_TIME',   'Part Time'

    class Status(models.TextChoices):
        OPEN    = 'OPEN',    'Open (Accepting Requisitions)'
        FILLED  = 'FILLED',  'Filled'
        FROZEN  = 'FROZEN',  'Frozen (Budget Hold)'
        CLOSED  = 'CLOSED',  'Closed'

    title           = models.CharField(max_length=255)
    department_id   = models.UUIDField(db_index=True)        # Soft FK to hrms.Department
    designation_id  = models.UUIDField(null=True, blank=True, db_index=True)  # Soft FK to hrms.Designation
    cost_center     = models.ForeignKey(
        'hrms.CostCenter', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='positions'
    )
    position_type   = models.CharField(max_length=15, choices=PositionType.choices, default=PositionType.PERMANENT)
    max_headcount   = models.PositiveIntegerField(default=1)
    current_headcount = models.PositiveIntegerField(default=0)
    status          = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN, db_index=True)

    # Budget
    budgeted_ctc_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budgeted_ctc_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Description
    job_description = models.TextField(blank=True)
    required_skills = models.JSONField(default=list, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_positions'
        indexes = [
            models.Index(fields=['business_unit_id', 'status']),
            models.Index(fields=['business_unit_id', 'department_id', 'status']),
        ]

    @property
    def vacancies(self) -> int:
        return max(0, self.max_headcount - self.current_headcount)

    def __str__(self) -> str:
        return f"{self.title} ({self.status}) [{self.current_headcount}/{self.max_headcount} filled]"


class ManpowerRequest(TenantModel):
    """
    A formal request to fill one or more positions.

    Created by a department manager when headcount is needed.
    Approved by HR/Finance before a JobPosting can be created.
    On approval: creates a recruitment.JobPosting and links it via job_posting_id.
    """

    class Status(models.TextChoices):
        DRAFT    = 'DRAFT',    'Draft'
        PENDING  = 'PENDING',  'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CLOSED   = 'CLOSED',   'Closed'

    position         = models.ForeignKey(Position, on_delete=models.PROTECT, null=True, blank=True, related_name='requisitions')
    requested_by_id  = models.UUIDField(db_index=True)  # Soft FK to iam.User (Manager)
    requested_count  = models.PositiveIntegerField(default=1)
    justification    = models.TextField()
    urgency          = models.CharField(
        max_length=10, default='NORMAL',
        choices=[('LOW', 'Low'), ('NORMAL', 'Normal'), ('HIGH', 'High'), ('URGENT', 'Urgent')]
    )
    target_joining_date = models.DateField(null=True, blank=True)

    status           = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True)
    approved_by_id   = models.UUIDField(null=True, blank=True)
    approved_at      = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Linked to recruitment.JobPosting after approval
    job_posting_id   = models.UUIDField(null=True, blank=True, db_index=True)  # Soft FK to recruitment.JobPosting

    class Meta(TenantModel.Meta):
        db_table = 'hrms_manpower_requests'
        indexes = [
            models.Index(fields=['business_unit_id', 'status']),
            models.Index(fields=['business_unit_id', 'requested_by_id']),
        ]

    def __str__(self) -> str:
        return f"MRF: {self.position} × {self.requested_count} [{self.status}]"

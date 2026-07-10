# yss_orbit/backend/apps/hrms/models/onboarding.py
"""
Onboarding Workflow Engine.

Prevents HR from manually tracking new joiner task completion via email/spreadsheet.
HR creates an OnboardingTemplate with tasks, assigns it on hire, and tracks completion.

Lifecycle:
    Candidate HIRED
        ↓
    EmployeeOnboarding created (status=PREBOARDING)
        ↓
    Tasks completed one by one (by HR/IT/Manager/Employee)
        ↓
    All blocking tasks done → Employee status can be set ACTIVE
        ↓
    EmployeeOnboarding status → COMPLETED
"""
from django.db import models
from apps.platform.models.base import TenantModel


class OnboardingTemplate(TenantModel):
    """
    Reusable onboarding checklist template.
    Can be filtered by employment_type (full-time vs. contractor) or department.
    The template with is_default=True is auto-applied when no department match is found.
    """

    class EmploymentType(models.TextChoices):
        ALL         = 'ALL',         'All Types'
        FULL_TIME   = 'FULL_TIME',   'Full Time'
        PART_TIME   = 'PART_TIME',   'Part Time'
        CONTRACT    = 'CONTRACT',    'Contract'
        INTERN      = 'INTERN',      'Intern'
        CONSULTANT  = 'CONSULTANT',  'Consultant'

    name             = models.CharField(max_length=200)
    description      = models.TextField(blank=True)
    employment_type  = models.CharField(max_length=15, choices=EmploymentType.choices, default=EmploymentType.ALL)
    department_id    = models.UUIDField(null=True, blank=True, db_index=True)  # Null = applies to all departments
    is_default       = models.BooleanField(default=False)
    is_active        = models.BooleanField(default=True)
    estimated_days   = models.PositiveIntegerField(default=7)  # Expected completion window

    class Meta(TenantModel.Meta):
        db_table = 'hrms_onboarding_templates'
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.employment_type})"


class OnboardingTask(TenantModel):
    """
    Individual task within an onboarding template.
    Tasks are assigned to a role (not a person) — HR/IT/MANAGER/EMPLOYEE.
    Blocking tasks prevent employee ACTIVE status until complete.
    """

    class TaskType(models.TextChoices):
        DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD', 'Document Upload'
        FORM_FILL       = 'FORM_FILL',       'Form Fill'
        ASSET_ISSUE     = 'ASSET_ISSUE',     'Asset Issue'
        SYSTEM_ACCESS   = 'SYSTEM_ACCESS',   'System / Email Access Setup'
        SIGN_OFF        = 'SIGN_OFF',        'Sign-Off Required'
        TRAINING        = 'TRAINING',        'Mandatory Training'
        POLICY_ACCEPT   = 'POLICY_ACCEPT',   'Policy Acceptance'
        MANUAL          = 'MANUAL',          'Manual Task'

    class AssignedRole(models.TextChoices):
        HR       = 'HR',       'HR Team'
        IT       = 'IT',       'IT Team'
        MANAGER  = 'MANAGER',  'Reporting Manager'
        EMPLOYEE = 'EMPLOYEE', 'Employee (Self)'
        FINANCE  = 'FINANCE',  'Finance Team'

    template              = models.ForeignKey(OnboardingTemplate, on_delete=models.CASCADE, related_name='tasks')
    title                 = models.CharField(max_length=255)
    description           = models.TextField(blank=True)
    task_type             = models.CharField(max_length=20, choices=TaskType.choices, default=TaskType.MANUAL)
    assigned_to_role      = models.CharField(max_length=10, choices=AssignedRole.choices, default=AssignedRole.HR)
    due_days_from_joining = models.IntegerField(default=0)   # 0 = Day 1; -3 = 3 days before joining (preboarding)
    is_blocking           = models.BooleanField(default=False)  # Blocks Employee ACTIVE if not done
    is_optional           = models.BooleanField(default=False)
    sort_order            = models.PositiveSmallIntegerField(default=0)
    help_text             = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_onboarding_tasks'
        ordering = ['sort_order', 'due_days_from_joining']

    def __str__(self) -> str:
        flag = ' [BLOCKING]' if self.is_blocking else ''
        return f"[{self.template.name}] {self.sort_order}. {self.title}{flag}"


class EmployeeOnboarding(TenantModel):
    """
    Tracks the onboarding progress for a specific employee.
    Created automatically when a candidate is hired (recruitment → employee flow).
    """

    class Status(models.TextChoices):
        PREBOARDING  = 'PREBOARDING',  'Pre-Boarding'
        IN_PROGRESS  = 'IN_PROGRESS',  'In Progress'
        COMPLETED    = 'COMPLETED',    'Completed'
        OVERDUE      = 'OVERDUE',      'Overdue'
        CANCELLED    = 'CANCELLED',    'Cancelled'

    employee_id               = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    template                  = models.ForeignKey(OnboardingTemplate, on_delete=models.PROTECT)
    status                    = models.CharField(max_length=15, choices=Status.choices, default=Status.PREBOARDING, db_index=True)
    start_date                = models.DateField()   # Usually = date_of_joining
    expected_completion_date  = models.DateField()
    completed_at              = models.DateTimeField(null=True, blank=True)
    completion_percentage     = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes                     = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_onboarding'
        unique_together = [('business_unit_id', 'employee_id')]  # One active onboarding per employee
        indexes = [
            models.Index(fields=['business_unit_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Onboarding: {self.employee_id} [{self.status}] {self.completion_percentage}%"


class OnboardingTaskCompletion(TenantModel):
    """
    Records the completion status of one task in one employee's onboarding.
    Created for all tasks from the template when EmployeeOnboarding is initialized.
    """

    class Status(models.TextChoices):
        PENDING   = 'PENDING',   'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        SKIPPED   = 'SKIPPED',   'Skipped (Optional Only)'
        OVERDUE   = 'OVERDUE',   'Overdue'
        WAIVED    = 'WAIVED',    'Waived by HR'

    onboarding    = models.ForeignKey(EmployeeOnboarding, on_delete=models.CASCADE, related_name='task_completions')
    task          = models.ForeignKey(OnboardingTask, on_delete=models.CASCADE)
    due_date      = models.DateField(null=True, blank=True)
    status        = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    completed_by_id = models.UUIDField(null=True, blank=True)  # Soft FK to iam.User
    completed_at  = models.DateTimeField(null=True, blank=True)
    notes         = models.TextField(blank=True)
    file_asset_id = models.UUIDField(null=True, blank=True)  # Document uploads for DOCUMENT_UPLOAD tasks

    class Meta(TenantModel.Meta):
        db_table = 'hrms_onboarding_task_completions'
        unique_together = [('business_unit_id', 'onboarding', 'task')]
        indexes = [
            models.Index(fields=['business_unit_id', 'onboarding_id', 'status']),
        ]

    def __str__(self) -> str:
        return f"Task '{self.task.title}' for Onboarding {self.onboarding_id}: [{self.status}]"

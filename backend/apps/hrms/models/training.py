# yss_orbit/backend/apps/hrms/models/training.py
"""
Training & Certifications Module.

Tracks employee skill development through internal/external courses and certifications.
Integrates with MSS (manager nominates team) and ESS (employee views enrollment).
Training completion events are published to EmployeeEvent for 360 Timeline.
"""
from django.db import models
from apps.platform.models.base import TenantModel


class TrainingCourse(TenantModel):
    """
    Defines a training program or certification course available in the BU.
    Can be mandatory (auto-enrolled for target departments/employment types)
    or optional (nominated by manager or self-enrolled).
    """

    class CourseType(models.TextChoices):
        INTERNAL        = 'INTERNAL',       'Internal (Conducted in-house)'
        EXTERNAL        = 'EXTERNAL',       'External (Third-party vendor)'
        ONLINE          = 'ONLINE',         'Online / E-Learning'
        CERTIFICATION   = 'CERTIFICATION',  'Professional Certification'
        REGULATORY      = 'REGULATORY',     'Regulatory / Compliance'
        ON_THE_JOB      = 'ON_THE_JOB',     'On-the-Job Training'

    class Status(models.TextChoices):
        DRAFT     = 'DRAFT',     'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        ARCHIVED  = 'ARCHIVED',  'Archived'

    title             = models.CharField(max_length=255)
    description       = models.TextField(blank=True)
    course_type       = models.CharField(max_length=15, choices=CourseType.choices, default=CourseType.INTERNAL)
    provider          = models.CharField(max_length=200, blank=True)
    provider_url      = models.URLField(blank=True)
    duration_hours    = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    cost_per_employee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Targeting
    is_mandatory      = models.BooleanField(default=False)
    target_department_ids = models.JSONField(default=list, blank=True)  # [] = all departments
    target_employment_types = models.JSONField(default=list, blank=True)  # [] = all types

    # Certification specific
    issues_certificate    = models.BooleanField(default=False)
    certificate_validity_days = models.IntegerField(null=True, blank=True)  # null = no expiry

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT, db_index=True)
    created_by_id = models.UUIDField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_training_courses'
        ordering = ['title']

    def __str__(self) -> str:
        return f"{self.title} ({self.course_type})"


class EmployeeTraining(TenantModel):
    """
    Records an employee's enrollment and progress in a training course.
    Created when HR/Manager nominates or employee self-enrolls.
    On COMPLETED: publishes EmployeeEvent.TRAINING_COMPLETED for Timeline.
    If course.issues_certificate and expires_on set, document expiry alert fires before expiry.
    """

    class Status(models.TextChoices):
        NOMINATED  = 'NOMINATED',  'Nominated'
        ENROLLED   = 'ENROLLED',   'Enrolled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED  = 'COMPLETED',  'Completed'
        FAILED     = 'FAILED',     'Failed'
        CANCELLED  = 'CANCELLED',  'Cancelled'
        WITHDRAWN  = 'WITHDRAWN',  'Withdrawn'

    employee_id    = models.UUIDField(db_index=True)  # Soft FK to hrms.Employee
    course         = models.ForeignKey(TrainingCourse, on_delete=models.PROTECT, related_name='enrollments')
    status         = models.CharField(max_length=15, choices=Status.choices, default=Status.NOMINATED, db_index=True)
    nominated_by_id = models.UUIDField(null=True, blank=True)  # Manager or HR soft FK to iam.User
    enrollment_date = models.DateField(null=True, blank=True)
    start_date      = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    score           = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # % or rating
    pass_mark       = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Certificate details (if course.issues_certificate)
    certificate_number = models.CharField(max_length=100, blank=True)
    certificate_url    = models.CharField(max_length=500, blank=True)
    expires_on         = models.DateField(null=True, blank=True, db_index=True)

    cost_incurred = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remarks       = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = 'hrms_employee_trainings'
        indexes = [
            models.Index(fields=['business_unit_id', 'employee_id', 'status']),
            models.Index(fields=['business_unit_id', 'course_id', 'status']),
            # For expiry alerts
            models.Index(fields=['business_unit_id', 'expires_on']),
        ]

    def __str__(self) -> str:
        return f"{self.employee_id} — {self.course.title} [{self.status}]"

# yss_orbit\backend\apps\recruitment\models.py
"""
YSS Orbit — Recruitment & Appraisal Models
Recruitment: Job postings, Applications, Interview stages.
Appraisal: Performance review cycles, employee evaluations, KPIs.
"""
from __future__ import annotations

import uuid
from django.db import models
from apps.platform.models.base import TenantModel


# ─────────────────────────────────────────────────────────────────────────────
# RECRUITMENT MODELS
# ─────────────────────────────────────────────────────────────────────────────

class JobPosting(TenantModel):
    """Job opening published by a Business Unit."""

    class PostingStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        OPEN = "OPEN", "Open"
        ON_HOLD = "ON_HOLD", "On Hold"
        FILLED = "FILLED", "Filled"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    class WorkMode(models.TextChoices):
        ON_SITE = "ON_SITE", "On-Site"
        REMOTE = "REMOTE", "Remote"
        HYBRID = "HYBRID", "Hybrid"

    title = models.CharField(max_length=255)
    job_code = models.CharField(max_length=30, db_index=True)
    department_id = models.UUIDField(null=True, blank=True)
    designation_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=PostingStatus.choices, default=PostingStatus.DRAFT, db_index=True)
    work_mode = models.CharField(max_length=10, choices=WorkMode.choices, default=WorkMode.ON_SITE)

    # Requirements
    total_openings = models.PositiveSmallIntegerField(default=1)
    filled_count = models.PositiveSmallIntegerField(default=0)
    min_experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    max_experience_years = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_salary_confidential = models.BooleanField(default=True)

    # Dates
    published_at = models.DateTimeField(null=True, blank=True)
    application_deadline = models.DateField(null=True, blank=True, db_index=True)
    expected_joining_date = models.DateField(null=True, blank=True)

    # Description
    job_description = models.TextField()
    requirements = models.TextField(blank=True)
    benefits = models.TextField(blank=True)

    # Created by
    created_by_id = models.UUIDField(null=True, blank=True)
    hiring_manager_id = models.UUIDField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "recruitment_job_postings"
        unique_together = [("business_unit_id", "job_code")]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status"]),
            models.Index(fields=["application_deadline"]),
        ]


class JobApplication(TenantModel):
    """Candidate application for a job posting."""

    class ApplicationStatus(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        SCREENING = "SCREENING", "Screening"
        SHORTLISTED = "SHORTLISTED", "Shortlisted"
        INTERVIEWING = "INTERVIEWING", "Interviewing"
        OFFERED = "OFFERED", "Offer Extended"
        ACCEPTED = "ACCEPTED", "Offer Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn (Candidate)"
        HIRED = "HIRED", "Hired"
        NO_SHOW = "NO_SHOW", "No Show"

    class ApplicationSource(models.TextChoices):
        PORTAL = "PORTAL", "Job Portal"
        REFERRAL = "REFERRAL", "Employee Referral"
        DIRECT = "DIRECT", "Direct Application"
        AGENCY = "AGENCY", "Recruitment Agency"
        LINKEDIN = "LINKEDIN", "LinkedIn"
        CAMPUS = "CAMPUS", "Campus Placement"
        OTHER = "OTHER", "Other"

    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=15, choices=ApplicationStatus.choices, default=ApplicationStatus.APPLIED, db_index=True)

    # Candidate info (PII)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True)  # PII
    phone = models.CharField(max_length=20)  # PII
    current_employer = models.CharField(max_length=200, blank=True)
    current_designation = models.CharField(max_length=200, blank=True)
    current_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # PII
    expected_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # PII
    notice_period_days = models.PositiveSmallIntegerField(default=0)
    total_experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    location = models.CharField(max_length=100, blank=True)

    # Resume
    resume_url = models.URLField(null=True, blank=True)
    resume_filename = models.CharField(max_length=255, blank=True)

    source = models.CharField(max_length=15, choices=ApplicationSource.choices, default=ApplicationSource.DIRECT)
    referral_employee_id = models.UUIDField(null=True, blank=True)
    agency_name = models.CharField(max_length=200, blank=True)

    # Rejection/withdrawal
    rejection_reason = models.TextField(blank=True)
    withdrawal_reason = models.TextField(blank=True)

    # Internal rating
    rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5
    internal_notes = models.TextField(blank=True)

    # When converted to employee
    employee_id = models.UUIDField(null=True, blank=True)
    hired_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        db_table = "recruitment_applications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status"]),
            models.Index(fields=["job_posting", "status"]),
            models.Index(fields=["email"]),
        ]

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class InterviewStage(TenantModel):
    """Interview stage definition for a job posting."""

    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name="stages")
    name = models.CharField(max_length=100)
    stage_type = models.CharField(
        max_length=20,
        choices=[
            ("PHONE_SCREEN", "Phone Screen"),
            ("TECHNICAL", "Technical Round"),
            ("HR", "HR Round"),
            ("MANAGERIAL", "Managerial Round"),
            ("APTITUDE", "Aptitude Test"),
            ("PRACTICAL", "Practical Test"),
            ("FINAL", "Final Round"),
        ],
    )
    sort_order = models.PositiveSmallIntegerField(default=0)
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    interviewer_ids = models.JSONField(default=list)

    class Meta(TenantModel.Meta):
        db_table = "recruitment_interview_stages"
        ordering = ["sort_order"]


class Interview(TenantModel):
    """Scheduled interview for a candidate."""

    class InterviewResult(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PASS = "PASS", "Pass"
        FAIL = "FAIL", "Fail"
        ON_HOLD = "ON_HOLD", "On Hold"
        NO_SHOW = "NO_SHOW", "No Show"

    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name="interviews")
    stage = models.ForeignKey(InterviewStage, on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_at = models.DateTimeField(db_index=True)
    duration_minutes = models.PositiveSmallIntegerField(default=60)
    interview_mode = models.CharField(max_length=10, choices=[("ONLINE", "Online"), ("IN_PERSON", "In-Person")], default="IN_PERSON")
    meeting_link = models.URLField(blank=True)
    venue = models.CharField(max_length=200, blank=True)
    interviewer_ids = models.JSONField(default=list)
    result = models.CharField(max_length=10, choices=InterviewResult.choices, default=InterviewResult.PENDING, db_index=True)
    overall_rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5
    feedback = models.TextField(blank=True)
    strengths = models.TextField(blank=True)
    weaknesses = models.TextField(blank=True)
    recommendation = models.CharField(
        max_length=15,
        choices=[("PROCEED", "Proceed"), ("REJECT", "Reject"), ("HOLD", "Hold")],
        blank=True,
    )

    class Meta(TenantModel.Meta):
        db_table = "recruitment_interviews"
        ordering = ["-scheduled_at"]




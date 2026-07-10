# yss_orbit\backend\apps\jobs\models.py
"""
YSS Orbit — Jobs Model
Tracks long-running background jobs (Celery tasks).
Frontend polls /api/v1/jobs/{job_id}/ or listens via SSE.
"""
from __future__ import annotations

import uuid
from typing import Any

from django.db import models
from django.utils import timezone


class JobStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"
    CANCELLED = "CANCELLED", "Cancelled"


class BackgroundJob(models.Model):
    """
    Tracks all long-running background operations.

    Every async endpoint returns a job_id.
    Frontend can poll /api/v1/jobs/{job_id}/ or listen via SSE event.
    Job records expire after 24 hours.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    celery_task_id = models.CharField(max_length=255, blank=True, db_index=True)

    # Job classification
    job_type = models.CharField(max_length=100, db_index=True)  # e.g. "payroll.generate"
    name = models.CharField(max_length=255)  # Human-readable name

    # Tenant context
    business_unit_id = models.UUIDField(db_index=True)
    triggered_by_id = models.UUIDField(null=True, blank=True, db_index=True)  # User who triggered

    # Status
    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PENDING,
        db_index=True,
    )
    progress_percent = models.PositiveSmallIntegerField(default=0)
    progress_message = models.CharField(max_length=500, blank=True)

    # Input / Output
    input_data = models.JSONField(default=dict)   # Parameters that triggered the job
    result_data = models.JSONField(null=True, blank=True)  # Final result
    error_message = models.TextField(blank=True)
    error_details = models.JSONField(null=True, blank=True)

    # Timing
    correlation_id = models.CharField(max_length=36, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = "background_jobs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status", "created_at"]),
            models.Index(fields=["triggered_by_id", "created_at"]),
            models.Index(fields=["expires_at", "status"]),
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.expires_at:
            from django.conf import settings
            hours = getattr(settings, "JOB_EXPIRY_HOURS", 24)
            self.expires_at = timezone.now() + timezone.timedelta(hours=hours)
        super().save(*args, **kwargs)

    def mark_started(self) -> None:
        self.status = JobStatus.IN_PROGRESS
        self.started_at = timezone.now()
        self.save(update_fields=["status", "started_at"])

    def update_progress(self, percent: int, message: str = "") -> None:
        self.progress_percent = min(100, max(0, percent))
        self.progress_message = message[:500]
        self.save(update_fields=["progress_percent", "progress_message"])

    def mark_completed(self, result_data: dict[str, Any] | None = None) -> None:
        self.status = JobStatus.COMPLETED
        self.progress_percent = 100
        self.result_data = result_data
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "progress_percent", "result_data", "completed_at"])

    def mark_failed(self, error: str, details: dict[str, Any] | None = None) -> None:
        self.status = JobStatus.FAILED
        self.error_message = error[:2000]
        self.error_details = details
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "error_message", "error_details", "completed_at"])

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

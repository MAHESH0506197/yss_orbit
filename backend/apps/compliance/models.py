import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class ConsentRecord(models.Model):
    CONSENT_TYPES = (
        ('marketing', 'Marketing Communications'),
        ('essential', 'Essential Processing'),
        ('analytics', 'Analytics & Tracking'),
        ('cross_border', 'Cross-Border Transfer'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='consent_records',
        help_text="User who granted or withdrew consent"
    )
    policy_version = models.CharField(max_length=50, help_text="Version of the privacy policy consented to")
    consent_type = models.CharField(max_length=50, choices=CONSENT_TYPES, help_text="Type of consent")
    is_granted = models.BooleanField(default=True, help_text="True if consent is granted, False if withdrawn")
    channel = models.CharField(max_length=100, blank=True, null=True, help_text="Channel through which consent was obtained")
    granted_at = models.DateTimeField(default=timezone.now)
    withdrawn_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'compliance_consent_record'
        ordering = ['-granted_at']

    def __str__(self):
        return f"{self.user} - {self.consent_type} - {'Granted' if self.is_granted else 'Withdrawn'}"

    def withdraw(self):
        self.is_granted = False
        self.withdrawn_at = timezone.now()
        self.save()


class DataSubjectRequest(models.Model):
    REQUEST_TYPES = (
        ('export', 'Data Export / Portability'),
        ('erasure', 'Data Erasure / Anonymization'),
        ('access', 'Data Access'),
        ('correction', 'Data Correction'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='data_requests',
        help_text="User initiating the request"
    )
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    details = models.TextField(blank=True, null=True, help_text="Additional details regarding the request")
    created_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_data_requests'
    )

    class Meta:
        db_table = 'compliance_data_subject_request'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.request_type} - {self.status}"

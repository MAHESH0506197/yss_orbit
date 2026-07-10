from django.db import models
from apps.platform.models.base import TenantModel


class NotificationTemplate(TenantModel):
    """
    Centralized notification template registry.
    Each event_type (e.g. LEAVE_APPROVED) maps to channel-specific message templates.
    Uses Django/Jinja2 template syntax with context variables ({{ variable }}).
    """

    class EventType(models.TextChoices):
        # Leave events
        LEAVE_APPLIED = 'LEAVE_APPLIED', 'Leave Applied (to Manager)'
        LEAVE_APPROVED = 'LEAVE_APPROVED', 'Leave Approved (to Employee)'
        LEAVE_REJECTED = 'LEAVE_REJECTED', 'Leave Rejected (to Employee)'
        # Attendance events
        ATTENDANCE_CORRECTION_SUBMITTED = (
            'ATTENDANCE_CORRECTION_SUBMITTED',
            'Attendance Correction Submitted',
        )
        ATTENDANCE_CORRECTION_APPROVED = (
            'ATTENDANCE_CORRECTION_APPROVED',
            'Attendance Correction Approved',
        )
        # Payroll events
        PAYROLL_PROCESSED = 'PAYROLL_PROCESSED', 'Payroll Processed (to HR/Finance)'
        PAYSLIP_AVAILABLE = 'PAYSLIP_AVAILABLE', 'Payslip Available (to Employee)'
        # Document events
        DOC_EXPIRY_30_DAYS = 'DOC_EXPIRY_30_DAYS', 'Document Expiring in 30 Days'
        DOC_EXPIRY_7_DAYS = 'DOC_EXPIRY_7_DAYS', 'Document Expiring in 7 Days'
        DOC_EXPIRED = 'DOC_EXPIRED', 'Document Expired'
        # HR lifecycle events
        TRANSFER_APPROVED = 'TRANSFER_APPROVED', 'Transfer Approved'
        PROMOTION_APPROVED = 'PROMOTION_APPROVED', 'Promotion Approved'
        EXIT_APPROVED = 'EXIT_APPROVED', 'Exit Approved'
        # Training events
        TRAINING_NOMINATED = 'TRAINING_NOMINATED', 'Training Nomination (to Employee)'
        TRAINING_COMPLETED = 'TRAINING_COMPLETED', 'Training Completed'
        # Appraisal events
        APPRAISAL_LAUNCHED = 'APPRAISAL_LAUNCHED', 'Appraisal Cycle Launched'
        APPRAISAL_SELF_REVIEW_DUE = (
            'APPRAISAL_SELF_REVIEW_DUE',
            'Self Review Due Reminder',
        )
        # Onboarding events
        ONBOARDING_TASK_DUE = 'ONBOARDING_TASK_DUE', 'Onboarding Task Due'
        ONBOARDING_COMPLETED = 'ONBOARDING_COMPLETED', 'Onboarding Completed'
        # IT Declaration events
        IT_DECLARATION_DUE = 'IT_DECLARATION_DUE', 'IT Declaration Deadline Reminder'
        IT_PROOF_REJECTED = 'IT_PROOF_REJECTED', 'Investment Proof Rejected'

    event_type = models.CharField(
        max_length=60, choices=EventType.choices, unique=True
    )
    subject_template = models.CharField(max_length=500)
    body_template = models.TextField()  # Supports {{ variable }} syntax
    sms_template = models.CharField(max_length=160, blank=True)
    push_template = models.CharField(max_length=255, blank=True)
    channels = models.JSONField(default=list)  # ['IN_APP', 'EMAIL', 'SMS', 'PUSH']
    is_active = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'notifications_templates'

    def __str__(self):
        return f"NotificationTemplate: {self.event_type}"


class NotificationPreference(TenantModel):
    """
    Per-user, per-event channel preferences.
    Allows employees to opt-out of specific channels (e.g. SMS) while retaining
    in-app and email notifications for the same event type.
    """

    user_id = models.UUIDField(db_index=True)  # Soft FK to iam.User
    event_type = models.CharField(max_length=60)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)

    class Meta(TenantModel.Meta):
        db_table = 'notifications_preferences'
        unique_together = [('business_unit_id', 'user_id', 'event_type')]

    def __str__(self):
        return f"NotifPref: {self.user_id} / {self.event_type}"


class NotificationLog(TenantModel):
    """
    Immutable audit log of all dispatched notifications.
    Used for debugging delivery failures, retry tracking, and compliance audits.
    Records one row per channel dispatch attempt.
    """

    class Channel(models.TextChoices):
        IN_APP = 'IN_APP', 'In-App'
        EMAIL = 'EMAIL', 'Email'
        SMS = 'SMS', 'SMS'
        PUSH = 'PUSH', 'Push'

    class Status(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    event_type = models.CharField(max_length=60, db_index=True)
    recipient_user_id = models.UUIDField(db_index=True)  # Soft FK to iam.User
    channel = models.CharField(max_length=10, choices=Channel.choices)
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.QUEUED
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    correlation_id = models.UUIDField(
        null=True, blank=True
    )  # Tracks the originating business event
    retry_count = models.PositiveSmallIntegerField(default=0)

    class Meta(TenantModel.Meta):
        db_table = 'notifications_log'
        indexes = [
            models.Index(
                fields=['business_unit_id', 'recipient_user_id', 'status']
            ),
            models.Index(fields=['business_unit_id', 'event_type']),
        ]

    def __str__(self):
        return (
            f"NotifLog: {self.event_type} → {self.recipient_user_id} "
            f"via {self.channel} [{self.status}]"
        )

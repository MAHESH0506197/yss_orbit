# yss_orbit\backend\apps\error_log\models.py
import uuid
from typing import Any
from django.db import models
from django.utils.translation import gettext_lazy as _

class ErrorLog(models.Model):
    """
    Model for recording application errors.
    Captures exceptions, traceback, request details, and environment context.
    """
    
    class Severity(models.TextChoices):
        CRITICAL = "CRITICAL", _("Critical")
        ERROR = "ERROR", _("Error")
        WARNING = "WARNING", _("Warning")
        INFO = "INFO", _("Info")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Error specifics
    message = models.TextField()
    exception_type = models.CharField(max_length=255, blank=True)
    traceback = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.ERROR)
    
    # Context
    user_id = models.UUIDField(null=True, blank=True, db_index=True)
    organization_id = models.UUIDField(null=True, blank=True, db_index=True)
    business_unit_id = models.UUIDField(null=True, blank=True, db_index=True)
    
    # Request data
    endpoint = models.CharField(max_length=255, blank=True)
    http_method = models.CharField(max_length=10, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_data = models.JSONField(null=True, blank=True)
    correlation_id = models.CharField(max_length=36, blank=True, db_index=True)
    
    # Resolution status
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by_id = models.UUIDField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "error_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["severity", "resolved", "created_at"]),
            models.Index(fields=["correlation_id"]),
            models.Index(fields=["user_id", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.severity}: {self.exception_type} at {self.endpoint}"

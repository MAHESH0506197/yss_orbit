from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from apps.platform.models.base import TenantModel

from django.conf import settings

class EmployeeImportSession(TenantModel):
    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", _("Uploaded")
        VALIDATING = "VALIDATING", _("Validating")
        VALIDATED = "VALIDATED", _("Validated")
        IMPORTING = "IMPORTING", _("Importing")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED = "FAILED", _("Failed")
        CANCELLED = "CANCELLED", _("Cancelled")

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
    )
    file_path = models.FileField(upload_to="imports/employees/")
    original_file_name = models.CharField(max_length=255)
    
    # Audit & Stats
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="employee_imports",
    )
    total_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    error_rows = models.IntegerField(default=0)
    
    # JSON Payload Storage
    validation_summary = models.JSONField(null=True, blank=True)
    error_grid = models.JSONField(null=True, blank=True)
    
    # Lifecycle
    expires_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "hrms_employee_import_session"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_file_name} ({self.status})"

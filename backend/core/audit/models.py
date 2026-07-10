import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)
    actor_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True
    )
    action = models.CharField(max_length=255, db_index=True)
    resource_type = models.CharField(max_length=255, db_index=True)
    resource_id = models.CharField(max_length=255, db_index=True)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Optional fields from rulebook
    correlation_id = models.UUIDField(null=True, blank=True, db_index=True)
    trace_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(max_length=50, default="SUCCESS")

    class Meta:
        db_table = 'audit_log'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.resource_type} ({self.resource_id})"

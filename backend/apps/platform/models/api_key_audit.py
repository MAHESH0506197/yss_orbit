# yss_orbit\backend\apps\api_consumer_key\models\api_key_audit.py
import uuid
from django.db import models
from apps.platform.models.base import TenantModel

class APIKeyAudit(TenantModel):
    """
    Audit log for tracking API Key usage.
    """
    api_key_id = models.UUIDField(db_index=True)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    status_code = models.IntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta(TenantModel.Meta):
        db_table = "api_key_audit_logs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"APIKeyAudit({self.api_key_id} - {self.endpoint} [{self.status_code}])"

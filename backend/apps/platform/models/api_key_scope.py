# yss_orbit\backend\apps\api_consumer_key\models\api_key_scope.py
import uuid
from django.db import models
from apps.platform.models.base import TenantModel

class APIKeyScope(TenantModel):
    """
    Represents an explicitly defined scope/permission that can be assigned to an API Key.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True, help_text="e.g. 'read:users'")
    description = models.TextField(blank=True)

    class Meta(TenantModel.Meta):
        db_table = "api_key_scopes"
        ordering = ["code"]

    def __str__(self) -> str:
        return self.code

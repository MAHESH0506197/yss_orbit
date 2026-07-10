# yss_orbit\backend\apps\api_consumer_key\models\api_consumer_key.py
import uuid
import bcrypt
from django.db import models
from apps.platform.models.base import TenantModel

class APIConsumerKey(TenantModel):
    """
    API Keys for programmatic access by external services.
    Keys are bcrypt hashed. Plaintext is only shown once on creation.
    """
    name = models.CharField(max_length=255)
    key_prefix = models.CharField(max_length=10, help_text="First 10 chars of the key for identification")
    hashed_key = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    # Scoped permissions
    permissions = models.JSONField(
        default=list, 
        help_text="List of permission codes this key is authorized for."
    )
    
    # Bound to a specific user (often a service account user)
    user_id = models.UUIDField(help_text="The user this API key acts on behalf of.")

    class Meta(TenantModel.Meta):
        db_table = "api_consumer_keys"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "is_active"]),
            models.Index(fields=["key_prefix"]),
        ]

    def __str__(self) -> str:
        return f"APIKey({self.name} - {self.key_prefix}...)"

    def set_key(self, plaintext_key: str) -> None:
        """Hashes and sets the API key."""
        salt = bcrypt.gensalt()
        self.hashed_key = bcrypt.hashpw(plaintext_key.encode('utf-8'), salt).decode('utf-8')
        self.key_prefix = plaintext_key[:10]

    def verify_key(self, plaintext_key: str) -> bool:
        """Verifies a plaintext key against the stored hash."""
        return bcrypt.checkpw(plaintext_key.encode('utf-8'), self.hashed_key.encode('utf-8'))

# yss_orbit\backend\apps\outbox\models\outbox_model.py
import uuid
from django.db import models
from django.utils import timezone

class OutboxStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    PUBLISHED = "PUBLISHED", "Published"
    FAILED = "FAILED", "Failed"

class OutboxMessage(models.Model):
    """
    Generic Outbox pattern implementation for non-domain event async tasks, 
    like webhook deliveries, email dispatches, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message_type = models.CharField(max_length=100, db_index=True)
    destination = models.CharField(max_length=255, help_text="Where this message is headed (e.g., webhook url, queue name)")
    payload = models.JSONField()
    
    status = models.CharField(max_length=20, choices=OutboxStatus.choices, default=OutboxStatus.PENDING, db_index=True)
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    last_error = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "outbox_message"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.message_type} to {self.destination} ({self.status})"

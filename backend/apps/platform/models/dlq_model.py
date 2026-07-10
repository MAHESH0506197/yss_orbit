# yss_orbit\backend\apps\outbox\models\dlq_model.py
import uuid
from django.db import models

class OutboxDeadLetter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_message_id = models.UUIDField(db_index=True)
    message_type = models.CharField(max_length=100)
    destination = models.CharField(max_length=255)
    payload = models.JSONField()
    error_reason = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "outbox_dead_letter"
        ordering = ["-created_at"]

    def __str__(self):
        return f"DLQ: {self.message_type} ({self.id})"

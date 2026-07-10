# yss_orbit\backend\core\transactions\transaction_manager.py
import json
import uuid
import logging
from typing import Any, Dict
from django.db import transaction, models
from django.utils import timezone
from core.database.transaction_manager import TransactionManager as DBTransactionManager

logger = logging.getLogger(__name__)

class OutboxMessage(models.Model):
    """
    Model representing a message in the transactional outbox.
    We define it here as a conceptual base/abstract model, or it should be 
    concretely defined in an app's models.py. Assuming abstract for core reusability.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    aggregate_type = models.CharField(max_length=255)
    aggregate_id = models.CharField(max_length=255)
    event_type = models.CharField(max_length=255)
    payload = models.JSONField()
    created_at = models.DateTimeField(default=timezone.now)
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['processed', 'created_at']),
        ]

class TransactionalOutboxManager:
    """
    Manages the saving of events to an outbox within a database transaction.
    This guarantees that the event is committed if and only if the transaction commits.
    """
    def __init__(self, outbox_model: type[models.Model]):
        self.outbox_model = outbox_model

    def save_event(self, aggregate_type: str, aggregate_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Saves an event to the outbox table. Must be called within an active transaction.
        """
        connection = transaction.get_connection()
        if not connection.in_atomic_block:
            logger.warning("save_event called outside of an atomic block. Outbox pattern guarantees may be violated.")

        event = self.outbox_model(
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            payload=payload
        )
        event.save()
        logger.debug(f"Saved {event_type} event to outbox for {aggregate_type}:{aggregate_id}")
        
        # Optionally register an on_commit hook to wake up the relay processor immediately
        # transaction.on_commit(lambda: notify_outbox_relay())

class TransactionManager(DBTransactionManager):
    """
    Extended transaction manager that incorporates outbox capabilities.
    """
    pass

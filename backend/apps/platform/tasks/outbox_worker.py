# yss_orbit\backend\apps\outbox\tasks\outbox_worker.py
import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from apps.platform.models import OutboxMessage, OutboxDeadLetter, OutboxStatus
from typing import Dict

logger = logging.getLogger(__name__)
BATCH_SIZE = 50

@shared_task(
    name="apps.platform.core_tasks.process_generic_outbox",
    queue="queue_outbox_generic",
    max_retries=0,
    time_limit=60,
)
def process_generic_outbox() -> Dict[str, int]:
    """
    Polls the generic outbox_message table and delivers payloads.
    Uses SELECT FOR UPDATE SKIP LOCKED.
    """
    stats = {"processed": 0, "failed": 0, "dead": 0}
    
    with transaction.atomic():
        pending_messages = list(
            OutboxMessage.objects
            .select_for_update(skip_locked=True)
            .filter(status=OutboxStatus.PENDING)
            .order_by("created_at")[:BATCH_SIZE]
        )
        
        if not pending_messages:
            return stats
        
        # Mark as processing
        OutboxMessage.objects.filter(id__in=[m.id for m in pending_messages]).update(
            status=OutboxStatus.PROCESSING
        )
        
    for message in pending_messages:
        try:
            # Here you would route by message_type or dispatch to the destination (e.g. HTTP POST to destination)
            # For this generic implementation, we assume successful dispatch logic here.
            # E.g., dispatch_to_destination(message.destination, message.payload)
            
            message.status = OutboxStatus.PUBLISHED
            message.published_at = timezone.now()
            message.save(update_fields=["status", "published_at"])
            stats["processed"] += 1
            
        except Exception as e:
            error_msg = str(e)
            message.retry_count += 1
            message.last_error = error_msg
            
            if message.retry_count >= message.max_retries:
                message.status = OutboxStatus.FAILED
                
                OutboxDeadLetter.objects.create(
                    original_message_id=message.id,
                    message_type=message.message_type,
                    destination=message.destination,
                    payload=message.payload,
                    error_reason=error_msg
                )
                stats["dead"] += 1
            else:
                message.status = OutboxStatus.PENDING
                stats["failed"] += 1
                
            message.save(update_fields=["retry_count", "last_error", "status"])
            logger.error(f"Failed to process generic outbox message {message.id}: {error_msg}")
            
    return stats

# yss_orbit\backend\apps\outbox\services\replay_service.py
from django.db import transaction
from django.utils import timezone
from apps.platform.models import OutboxMessage, OutboxDeadLetter
from apps.platform.models.outbox_model import OutboxStatus

class ReplayService:
    @classmethod
    @transaction.atomic
    def execute(cls, dlq_id: str = None) -> int:
        """
        Replays DLQ messages by recreating them in the Outbox and marking DLQ as resolved.
        """
        queryset = OutboxDeadLetter.objects.filter(resolved=False)
        if dlq_id:
            queryset = queryset.filter(id=dlq_id)
            
        count = 0
        for dlq in queryset:
            OutboxMessage.objects.create(
                message_type=dlq.message_type,
                destination=dlq.destination,
                payload=dlq.payload,
                status=OutboxStatus.PENDING,
                retry_count=0,
                max_retries=3
            )
            dlq.resolved = True
            dlq.resolved_at = timezone.now()
            dlq.save(update_fields=['resolved', 'resolved_at'])
            count += 1
            
        return count

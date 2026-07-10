# yss_orbit\backend\apps\outbox\services\dlq_service.py
from django.db import transaction
from apps.platform.models import OutboxMessage, OutboxDeadLetter

class DlqService:
    @classmethod
    @transaction.atomic
    def execute(cls, message: OutboxMessage) -> OutboxDeadLetter:
        """
        Moves a failed OutboxMessage to the Dead Letter Queue.
        """
        dlq_entry = OutboxDeadLetter.objects.create(
            original_message_id=message.id,
            message_type=message.message_type,
            destination=message.destination,
            payload=message.payload,
            error_reason=message.last_error or "Max retries exceeded"
        )
        return dlq_entry

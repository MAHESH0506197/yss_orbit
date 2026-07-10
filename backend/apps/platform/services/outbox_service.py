# yss_orbit\backend\apps\outbox\services\outbox_service.py
import logging
from typing import Any, Dict
from django.db import transaction
from apps.platform.models import OutboxMessage

logger = logging.getLogger(__name__)

class OutboxService:
    @staticmethod
    def publish(message_type: str, destination: str, payload: Dict[str, Any]) -> OutboxMessage:
        """
        Write a generic message to the outbox.
        Must be called within an active transaction.atomic() block.
        """
        message = OutboxMessage.objects.create(
            message_type=message_type,
            destination=destination,
            payload=payload
        )
        logger.debug(f"Generic outbox message queued: {message.id} ({message_type})")
        return message

    @staticmethod
    def publish_many(messages: list[Dict[str, Any]]) -> list[OutboxMessage]:
        records = [
            OutboxMessage(
                message_type=m["message_type"],
                destination=m["destination"],
                payload=m["payload"]
            )
            for m in messages
        ]
        return OutboxMessage.objects.bulk_create(records, batch_size=100)

# yss_orbit\backend\core\events\dead_letter_handler.py
import logging
from typing import Any
from datetime import datetime, timezone
from .base_event import BaseEvent

logger = logging.getLogger(__name__)

class EventDLQHandler:
    """
    Handles events that have failed all processing attempts.
    """
    
    def __init__(self, dlq_storage: Any):
        self.storage = dlq_storage

    async def push_to_dlq(self, event: BaseEvent, error: Exception, context: str = "") -> None:
        """
        Records the failed event to the Dead Letter Queue.
        """
        payload = {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "payload": event.model_dump_json(),
            "error": str(error),
            "context": context,
            "failed_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.error(f"Pushing event {event.event_id} to DLQ. Error: {error}")
        
        if self.storage:
            try:
                # await self.storage.save_dlq(payload)
                pass
            except Exception as e:
                logger.critical(f"Failed to write event {event.event_id} to DLQ storage! {e}")

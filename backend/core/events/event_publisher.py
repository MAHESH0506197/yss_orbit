# yss_orbit\backend\core\events\event_publisher.py
import logging
from .base_event import BaseEvent
from .event_contracts import EventPublisher

logger = logging.getLogger(__name__)

class DefaultEventPublisher(EventPublisher):
    """
    Default publisher that simply logs and writes to a message broker.
    For the outbox pattern, use the OutboxPublisher (or write to DB directly).
    """
    
    def __init__(self, broker_client: any = None):
        self.broker_client = broker_client

    async def publish(self, event: BaseEvent) -> None:
        """Publish the event to a broker (e.g., RabbitMQ, Kafka, Redis Pub/Sub)."""
        logger.info(f"Publishing event {event.event_type} [{event.event_id}]")
        
        if self.broker_client:
            # e.g., await self.broker_client.publish(event.event_type, event.model_dump_json())
            pass
        else:
            logger.debug(f"Mock publish: {event.model_dump_json()}")

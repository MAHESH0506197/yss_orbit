# yss_orbit\backend\apps\subscription\events\event_handlers.py
import logging
from .events import SubscriptionCreatedEvent, SubscriptionUpdatedEvent

logger = logging.getLogger(__name__)

def handle_subscription_created(event: SubscriptionCreatedEvent):
    logger.info(f"Handling SubscriptionCreatedEvent for id={event.id} tenant={event.tenant_id}")
    return True
    return True

def handle_subscription_updated(event: SubscriptionUpdatedEvent):
    logger.info(f"Handling SubscriptionUpdatedEvent for id={event.id} tenant={event.tenant_id}")
    return True
    return True

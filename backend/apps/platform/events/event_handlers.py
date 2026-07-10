# yss_orbit\backend\apps\support\events\event_handlers.py
import logging
from .events import TicketCreatedEvent, TicketStatusChangedEvent

logger = logging.getLogger(__name__)

def handle_ticket_created(event: TicketCreatedEvent):
    logger.info(f"Ticket {event.ticket_id} created by customer {event.customer_id}")

def handle_ticket_status_changed(event: TicketStatusChangedEvent):
    logger.info(f"Ticket {event.ticket_id} status changed from {event.old_status} to {event.new_status}")\n
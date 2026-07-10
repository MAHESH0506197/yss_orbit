# yss_orbit\backend\apps\support\events\events.py
from dataclasses import dataclass
from uuid import UUID

@dataclass
class TicketCreatedEvent:
    ticket_id: UUID
    customer_id: UUID

@dataclass
class TicketStatusChangedEvent:
    ticket_id: UUID
    old_status: str
    new_status: str\n
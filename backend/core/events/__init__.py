# yss_orbit\backend\core\events\__init__.py
"""Events module providing an Event Bus, Outbox pattern, and Idempotency guards."""

from .base_event import BaseEvent
from .event_contracts import EventPublisher, EventDispatcher
from .event_registry import EventRegistry
from .event_dispatcher import DefaultEventDispatcher
from .event_publisher import DefaultEventPublisher
from .event_bus import EventBus
from .idempotency_guard import idempotent
from .outbox_model import OutboxEvent
from .outbox_processor import OutboxProcessor
from .outbox_worker import start_outbox_worker
from .dead_letter_handler import EventDLQHandler
from .event_versioning import EventUpcaster

__all__ = [
    "BaseEvent",
    "EventPublisher",
    "EventDispatcher",
    "EventRegistry",
    "DefaultEventDispatcher",
    "DefaultEventPublisher",
    "EventBus",
    "idempotent",
    "OutboxEvent",
    "OutboxProcessor",
    "start_outbox_worker",
    "EventDLQHandler",
    "EventUpcaster",
]

# yss_orbit\backend\core\events\event_registry.py
import logging
from typing import Dict, Type, List
from .base_event import BaseEvent
from .event_contracts import EventHandler

logger = logging.getLogger(__name__)

class EventRegistry:
    """Registry to keep track of event classes and their subscribers/handlers."""
    
    _event_types: Dict[str, Type[BaseEvent]] = {}
    _handlers: Dict[str, List[EventHandler]] = {}

    @classmethod
    def register_event(cls, event_type: str):
        """Decorator to register an event model class."""
        def decorator(event_cls: Type[BaseEvent]):
            cls._event_types[event_type] = event_cls
            return event_cls
        return decorator

    @classmethod
    def register_handler(cls, event_type: str, handler: EventHandler) -> None:
        """Register a handler for a specific event type."""
        if event_type not in cls._handlers:
            cls._handlers[event_type] = []
        cls._handlers[event_type].append(handler)

    @classmethod
    def get_event_class(cls, event_type: str) -> Type[BaseEvent]:
        """Get the event class by type name."""
        return cls._event_types.get(event_type, BaseEvent)

    @classmethod
    def get_handlers(cls, event_type: str) -> List[EventHandler]:
        """Get all handlers registered for an event type."""
        return cls._handlers.get(event_type, [])

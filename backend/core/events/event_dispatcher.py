# yss_orbit\backend\core\events\event_dispatcher.py
import logging
import asyncio
from typing import List
from .base_event import BaseEvent
from .event_contracts import EventDispatcher, EventHandler
from .event_registry import EventRegistry

logger = logging.getLogger(__name__)

class DefaultEventDispatcher(EventDispatcher):
    """Dispatches events to all registered local handlers."""
    
    def register(self, event_type: str, handler: EventHandler) -> None:
        EventRegistry.register_handler(event_type, handler)
        logger.info(f"Registered handler {handler.__class__.__name__} for event {event_type}")

    async def dispatch(self, event: BaseEvent) -> None:
        """Dispatch event to all subscribed handlers concurrently."""
        handlers = EventRegistry.get_handlers(event.event_type)
        if not handlers:
            logger.debug(f"No handlers registered for event {event.event_type}")
            return

        logger.info(f"Dispatching event {event.event_type} [{event.event_id}] to {len(handlers)} handlers.")
        
        # In a highly durable system, this might dispatch via a queue.
        # Here we do local concurrent dispatch for synchronous systems.
        tasks = []
        for handler in handlers:
            tasks.append(self._safe_handle(handler, event))
            
        await asyncio.gather(*tasks)

    async def _safe_handle(self, handler: EventHandler, event: BaseEvent) -> None:
        try:
            await handler.handle(event)
        except Exception as e:
            logger.error(f"Handler {handler.__class__.__name__} failed to process event {event.event_id}: {e}", exc_info=True)
            # Depending on design, you might push to a DLQ here

# yss_orbit\backend\core\events\event_bus.py
from .base_event import BaseEvent
from .event_contracts import EventPublisher, EventDispatcher
from .event_publisher import DefaultEventPublisher
from .event_dispatcher import DefaultEventDispatcher

class EventBus:
    """
    Facade combining publisher and dispatcher.
    Used by domain services to publish events or local listeners to subscribe.
    """
    
    def __init__(self, publisher: EventPublisher = None, dispatcher: EventDispatcher = None):
        self.publisher = publisher or DefaultEventPublisher()
        self.dispatcher = dispatcher or DefaultEventDispatcher()

    async def publish(self, event: BaseEvent) -> None:
        """Publish an event to the external broker/outbox."""
        await self.publisher.publish(event)

    async def dispatch(self, event: BaseEvent) -> None:
        """Dispatch an incoming event to local handlers."""
        await self.dispatcher.dispatch(event)

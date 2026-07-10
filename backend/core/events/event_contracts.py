# yss_orbit\backend\core\events\event_contracts.py
from typing import Protocol, Awaitable, Any
from .base_event import BaseEvent

class EventHandler(Protocol):
    """Protocol for event handlers."""
    async def handle(self, event: BaseEvent) -> None:
        ...

class EventPublisher(Protocol):
    """Protocol for event publishers."""
    async def publish(self, event: BaseEvent) -> None:
        ...

class EventDispatcher(Protocol):
    """Protocol for event dispatchers."""
    def register(self, event_type: str, handler: EventHandler) -> None:
        ...
        
    async def dispatch(self, event: BaseEvent) -> None:
        ...

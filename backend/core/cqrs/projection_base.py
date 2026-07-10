# yss_orbit\backend\core\cqrs\projection_base.py
from abc import ABC, abstractmethod
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

class ProjectionBase(ABC):
    """
    Base class for projections.
    Projections listen to domain events and update Read Models or Materialized Views 
    to reflect the new state of the system for querying.
    """

    @abstractmethod
    def handle_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Processes a domain event and updates the corresponding read models.
        
        Args:
            event_type: String identifier of the event.
            payload: The event data.
        """
        pass
        
    def __call__(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Allows the projection to be called directly as a function.
        """
        logger.debug(f"Projection {self.__class__.__name__} handling event: {event_type}")
        self.handle_event(event_type, payload)

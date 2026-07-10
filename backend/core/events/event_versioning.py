# yss_orbit\backend\core\events\event_versioning.py
from typing import Dict, Any, Callable
from .base_event import BaseEvent

class EventUpcaster:
    """
    Handles versioning of events by upcasting older payloads to newer schemas.
    """
    
    _upcasters: Dict[str, Dict[int, Callable[[Dict[str, Any]], Dict[str, Any]]]] = {}

    @classmethod
    def register(cls, event_type: str, from_version: int):
        """Register an upcast function for a specific event type and version."""
        def decorator(func: Callable[[Dict[str, Any]], Dict[str, Any]]):
            if event_type not in cls._upcasters:
                cls._upcasters[event_type] = {}
            cls._upcasters[event_type][from_version] = func
            return func
        return decorator

    @classmethod
    def upcast(cls, event_type: str, version: int, payload: Dict[str, Any], target_version: int) -> Dict[str, Any]:
        """Upcasts a payload from a given version to the target version sequentially."""
        current_version = version
        current_payload = payload.copy()
        
        while current_version < target_version:
            upcaster = cls._upcasters.get(event_type, {}).get(current_version)
            if not upcaster:
                raise ValueError(f"No upcaster found for {event_type} from version {current_version}")
            
            current_payload = upcaster(current_payload)
            current_version += 1
            
        return current_payload

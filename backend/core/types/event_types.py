# yss_orbit\backend\core\types\event_types.py
"""
Event-related type definitions.
"""
from typing import Any, Dict, TypedDict

class EventPayload(TypedDict):
    event_id: str
    event_type: str
    aggregate_id: str
    aggregate_type: str
    payload: Dict[str, Any]
    timestamp: str
    version: int
    correlation_id: str
    causation_id: str

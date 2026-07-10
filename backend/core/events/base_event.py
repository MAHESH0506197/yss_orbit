# yss_orbit\backend\core\events\base_event.py
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel, Field

class BaseEvent(BaseModel):
    """Base class for all domain and integration events."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payload: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)

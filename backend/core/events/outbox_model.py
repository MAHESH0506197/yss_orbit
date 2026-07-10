# yss_orbit\backend\core\events\outbox_model.py
from enum import Enum
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Dict, Any

class OutboxStatus(str, Enum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class OutboxEvent(BaseModel):
    """
    Represents a database row in the Outbox table.
    Used for transactional outbox pattern to guarantee at-least-once delivery.
    """
    id: str
    event_type: str
    payload: str  # JSON serialized BaseEvent
    status: OutboxStatus = OutboxStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: datetime = None
    error: str = None
    retry_count: int = 0

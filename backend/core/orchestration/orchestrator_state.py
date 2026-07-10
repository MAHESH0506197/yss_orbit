# yss_orbit\backend\core\orchestration\orchestrator_state.py
from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime, timezone

class SagaStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    COMPENSATING = "COMPENSATING"
    COMPENSATED = "COMPENSATED"
    FAILED = "FAILED"

class SagaState(BaseModel):
    """Model representing the persistent state of a Saga workflow."""
    saga_id: str
    name: str
    status: SagaStatus = SagaStatus.PENDING
    context: Dict[str, Any] = Field(default_factory=dict)
    current_step_index: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    error_message: Optional[str] = None
    
    def update_status(self, status: SagaStatus, error: Optional[str] = None):
        self.status = status
        self.updated_at = datetime.now(timezone.utc)
        if error:
            self.error_message = error

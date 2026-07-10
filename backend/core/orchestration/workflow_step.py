# yss_orbit\backend\core\orchestration\workflow_step.py
from enum import Enum
from typing import Callable, Any, Optional, Dict, Awaitable
from pydantic import BaseModel

class StepStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    COMPENSATED = "COMPENSATED"

class WorkflowStep:
    """Represents a single step in a Saga workflow."""
    
    def __init__(
        self,
        name: str,
        action: Callable[..., Awaitable[Any]],
        compensation: Optional[Callable[..., Awaitable[Any]]] = None
    ):
        self.name = name
        self.action = action
        self.compensation = compensation

    async def execute(self, context: Dict[str, Any]) -> Any:
        """Executes the forward action."""
        return await self.action(context)

    async def compensate(self, context: Dict[str, Any]) -> Any:
        """Executes the compensation logic if defined."""
        if self.compensation:
            return await self.compensation(context)
        return None

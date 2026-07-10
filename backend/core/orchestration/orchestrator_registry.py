# yss_orbit\backend\core\orchestration\orchestrator_registry.py
import logging
from typing import Dict, Type
from .base_orchestrator import BaseOrchestrator

logger = logging.getLogger(__name__)

class OrchestratorRegistry:
    """Registry to hold and map saga names to their implementations."""
    
    _orchestrators: Dict[str, Type[BaseOrchestrator]] = {}

    @classmethod
    def register(cls, name: str):
        """Decorator to register an orchestrator."""
        def decorator(orchestrator_cls: Type[BaseOrchestrator]):
            if name in cls._orchestrators:
                logger.warning(f"Orchestrator '{name}' is already registered. Overwriting.")
            cls._orchestrators[name] = orchestrator_cls
            return orchestrator_cls
        return decorator

    @classmethod
    def get_orchestrator(cls, name: str) -> Type[BaseOrchestrator]:
        """Retrieve an orchestrator class by name."""
        if name not in cls._orchestrators:
            raise ValueError(f"Orchestrator '{name}' not found in registry.")
        return cls._orchestrators[name]

# yss_orbit\backend\core\tasks\task_registry.py
import logging
from typing import Dict, Type, Any
from .base_task import BaseTask

logger = logging.getLogger(__name__)

class TaskRegistry:
    """
    A centralized registry for dynamically discovering and managing tasks.
    Useful for introspection, metrics, and orchestrating sagas.
    """
    _tasks: Dict[str, Type[BaseTask]] = {}

    @classmethod
    def register(cls, name: str):
        """Decorator to register a task class."""
        def decorator(task_cls: Type[BaseTask]):
            if name in cls._tasks:
                logger.warning(f"Task with name {name} is already registered. Overwriting.")
            cls._tasks[name] = task_cls
            return task_cls
        return decorator

    @classmethod
    def get_task(cls, name: str) -> Type[BaseTask]:
        """Retrieve a task class by name."""
        if name not in cls._tasks:
            raise ValueError(f"Task {name} is not registered.")
        return cls._tasks[name]

    @classmethod
    def get_all_tasks(cls) -> Dict[str, Type[BaseTask]]:
        """Return all registered tasks."""
        return cls._tasks.copy()

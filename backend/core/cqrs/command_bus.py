# yss_orbit\backend\core\cqrs\command_bus.py
from typing import Type, Dict, TypeVar, Any
from .base_command import BaseCommand, CommandHandler
import logging

logger = logging.getLogger(__name__)

C = TypeVar('C', bound=BaseCommand)

class CommandBus:
    """
    Routes commands to their respective registered handlers.
    """
    def __init__(self):
        self._handlers: Dict[Type[BaseCommand], CommandHandler] = {}

    def register(self, command_type: Type[C], handler: CommandHandler):
        """
        Registers a handler for a specific command type.
        """
        if command_type in self._handlers:
            logger.warning(f"Handler for {command_type.__name__} is being overwritten.")
        self._handlers[command_type] = handler

    def dispatch(self, command: BaseCommand) -> Any:
        """
        Dispatches a command to its registered handler.
        """
        command_type = type(command)
        handler = self._handlers.get(command_type)
        if not handler:
            raise ValueError(f"No handler registered for command type: {command_type.__name__}")
        
        logger.debug(f"Dispatching command {command_type.__name__} to {handler.__class__.__name__}")
        return handler.handle(command)

# Global default command bus instance
command_bus = CommandBus()

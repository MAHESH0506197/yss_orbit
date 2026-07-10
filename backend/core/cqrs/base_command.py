# yss_orbit\backend\core\cqrs\base_command.py
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any

class BaseCommand(BaseModel):
    """
    Base class for all commands in the CQRS architecture.
    Commands should be data-only records (DTOs) representing an intent to mutate state.
    Pydantic is used for validation and serialization.
    """
    pass

class CommandHandler(ABC):
    """
    Base class for command handlers.
    Each command handler should be responsible for executing exactly one type of command.
    """
    
    @abstractmethod
    def handle(self, command: BaseCommand) -> Any:
        """
        Executes the command.
        
        Args:
            command: The command instance to execute.
            
        Returns:
            The result of the command execution (usually an ID or None).
        """
        pass

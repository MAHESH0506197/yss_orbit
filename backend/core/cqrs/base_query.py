# yss_orbit\backend\core\cqrs\base_query.py
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any, Generic, TypeVar

TResponse = TypeVar('TResponse')

class BaseQuery(BaseModel, Generic[TResponse]):
    """
    Base class for all queries in the CQRS architecture.
    Queries should be data-only records (DTOs) representing a request for data.
    They should never mutate state.
    """
    pass

class QueryHandler(ABC):
    """
    Base class for query handlers.
    Each query handler should be responsible for executing exactly one type of query.
    """
    
    @abstractmethod
    def handle(self, query: BaseQuery) -> Any:
        """
        Executes the query.
        
        Args:
            query: The query instance to execute.
            
        Returns:
            The requested data.
        """
        pass

# yss_orbit\backend\core\cqrs\query_bus.py
from typing import Type, Dict, TypeVar, Any
from .base_query import BaseQuery, QueryHandler
import logging

logger = logging.getLogger(__name__)

Q = TypeVar('Q', bound=BaseQuery)

class QueryBus:
    """
    Routes queries to their respective registered handlers.
    """
    def __init__(self):
        self._handlers: Dict[Type[BaseQuery], QueryHandler] = {}

    def register(self, query_type: Type[Q], handler: QueryHandler):
        """
        Registers a handler for a specific query type.
        """
        if query_type in self._handlers:
            logger.warning(f"Handler for {query_type.__name__} is being overwritten.")
        self._handlers[query_type] = handler

    def dispatch(self, query: BaseQuery) -> Any:
        """
        Dispatches a query to its registered handler.
        """
        query_type = type(query)
        handler = self._handlers.get(query_type)
        if not handler:
            raise ValueError(f"No handler registered for query type: {query_type.__name__}")
        
        logger.debug(f"Dispatching query {query_type.__name__} to {handler.__class__.__name__}")
        return handler.handle(query)

# Global default query bus instance
query_bus = QueryBus()

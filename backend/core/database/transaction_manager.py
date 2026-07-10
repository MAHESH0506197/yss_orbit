# yss_orbit\backend\core\database\transaction_manager.py
import logging
from typing import Callable, Any
from functools import wraps
from django.db import transaction
from django.db.transaction import get_connection

logger = logging.getLogger(__name__)

class TransactionManager:
    """
    Enterprise-grade transaction management.
    Provides wrappers and context managers for atomic operations, ensuring that side effects 
    (like publishing events or sending emails) only execute if the transaction successfully commits.
    """
    
    @staticmethod
    def atomic(using=None, savepoint=True, durable=False):
        """
        Wrapper around Django's transaction.atomic to provide additional safety.
        durable=True ensures that this is the outermost transaction block and it actually commits to DB.
        """
        return transaction.atomic(using=using, savepoint=savepoint, durable=durable)

    @staticmethod
    def on_commit(func: Callable, using=None):
        """
        Registers a callback to execute after the transaction successfully commits.
        Useful for publishing domain events, clearing caches, or enqueuing background tasks.
        """
        transaction.on_commit(func, using=using)

def transactional(durable=False, using=None):
    """
    Decorator to wrap a function in a database transaction.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with TransactionManager.atomic(using=using, durable=durable):
                return func(*args, **kwargs)
        return wrapper
    return decorator

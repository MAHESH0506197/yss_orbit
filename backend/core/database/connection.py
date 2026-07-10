# yss_orbit\backend\core\database\connection.py
import time
import logging
from typing import Callable, Any
from django.db import OperationalError, transaction

logger = logging.getLogger(__name__)

def execute_with_retry(func: Callable, max_retries: int = 3, backoff_factor: float = 0.5) -> Any:
    """
    Executes a database operation with retry logic for transient errors (e.g., deadlock, connection drop).
    
    Args:
        func: The function to execute.
        max_retries: Maximum number of retries before failing.
        backoff_factor: Multiplier for exponential backoff between retries.
        
    Returns:
        The result of the function execution.
        
    Raises:
        OperationalError: If max_retries are exceeded.
    """
    retries = 0
    while True:
        try:
            # Ensure the operation is wrapped in a transaction to roll back on failure
            with transaction.atomic():
                return func()
        except OperationalError as e:
            retries += 1
            if retries > max_retries:
                logger.error(f"Database operation failed after {max_retries} retries: {e}")
                raise
            
            sleep_time = backoff_factor * (2 ** (retries - 1))
            logger.warning(f"Database operational error encountered. Retrying in {sleep_time} seconds (Attempt {retries}/{max_retries}): {e}")
            time.sleep(sleep_time)

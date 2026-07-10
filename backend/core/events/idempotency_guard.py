# yss_orbit\backend\core\events\idempotency_guard.py
import functools
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)

def idempotent(store: Any = None):
    """
    Decorator to ensure a handler processes an event exactly once.
    Uses an external store (like Redis or a DB table) to track processed event IDs.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(self, event: Any, *args, **kwargs):
            if not hasattr(event, "event_id"):
                return await func(self, event, *args, **kwargs)
                
            event_id = event.event_id
            
            # Simple check if processed
            if store:
                is_processed = await store.exists(f"processed_events:{event_id}")
                if is_processed:
                    logger.info(f"Event {event_id} already processed. Skipping.")
                    return
            
            result = await func(self, event, *args, **kwargs)
            
            # Mark as processed
            if store:
                await store.set(f"processed_events:{event_id}", "1", expire=86400 * 7) # 7 days retention
                
            return result
        return wrapper
    return decorator

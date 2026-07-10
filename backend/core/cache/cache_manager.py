# yss_orbit\backend\core\cache\cache_manager.py
"""
Cache manager utility.
"""
from typing import Any, Optional, Callable
from django.core.cache import cache

class CacheManager:
    """
    Centralized cache manager wrapping Django's cache framework.
    """
    
    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        return cache.get(key, default)

    @staticmethod
    def set(key: str, value: Any, timeout: Optional[int] = 300) -> None:
        cache.set(key, value, timeout)

    @staticmethod
    def delete(key: str) -> None:
        cache.delete(key)

    @staticmethod
    def get_or_set(key: str, func: Callable[[], Any], timeout: Optional[int] = 300) -> Any:
        """Get from cache, or compute using func and set."""
        val = cache.get(key)
        if val is None:
            val = func()
            cache.set(key, val, timeout)
        return val

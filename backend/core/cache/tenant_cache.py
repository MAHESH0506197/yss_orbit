# yss_orbit\backend\core\cache\tenant_cache.py
"""
Tenant-aware caching logic.
"""
from typing import Any, Callable, Optional
from .cache_manager import CacheManager
from .cache_keys import generate_tenant_key

class TenantCache:
    """
    Cache wrapper that automatically isolates keys by tenant.
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def get(self, key: str, default: Any = None) -> Any:
        full_key = generate_tenant_key(self.tenant_id, key)
        return CacheManager.get(full_key, default)

    def set(self, key: str, value: Any, timeout: Optional[int] = 300) -> None:
        full_key = generate_tenant_key(self.tenant_id, key)
        CacheManager.set(full_key, value, timeout)

    def delete(self, key: str) -> None:
        full_key = generate_tenant_key(self.tenant_id, key)
        CacheManager.delete(full_key)

    def get_or_set(self, key: str, func: Callable[[], Any], timeout: Optional[int] = 300) -> Any:
        full_key = generate_tenant_key(self.tenant_id, key)
        return CacheManager.get_or_set(full_key, func, timeout)

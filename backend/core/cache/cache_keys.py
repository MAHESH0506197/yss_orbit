# yss_orbit\backend\core\cache\cache_keys.py
"""
Standardized cache key generators.
"""
from typing import Optional

def generate_tenant_key(tenant_id: str, key: str) -> str:
    """Generate a cache key isolated to a specific tenant."""
    return f"tenant:{tenant_id}:{key}"

def generate_user_key(user_id: str, key: str) -> str:
    """Generate a cache key isolated to a specific user."""
    return f"user:{user_id}:{key}"

def generate_permission_key(user_id: str, tenant_id: str) -> str:
    """Generate a cache key for user permissions in a tenant."""
    return f"perms:{tenant_id}:{user_id}"

def generate_rate_limit_key(identifier: str, action: str) -> str:
    """Generate a rate limit cache key."""
    return f"ratelimit:{action}:{identifier}"

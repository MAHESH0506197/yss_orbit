# yss_orbit\backend\core\rate_limiting\__init__.py
"""
Rate limiting module.
"""
from core.middleware.rate_limit_middleware import RateLimitMiddleware

__all__ = ["RateLimitMiddleware"]

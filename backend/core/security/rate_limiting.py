# yss_orbit\backend\core\security\rate_limiting.py
"""
YSS Orbit - Rate Limiting
Advanced rate limiting for APIs.
"""
from __future__ import annotations

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.core.cache import cache

class StandardUserRateThrottle(UserRateThrottle):
    """
    Standard rate limit for authenticated users.
    Configured via REST_FRAMEWORK settings under the 'standard' scope.
    """
    scope = 'standard'


class BurstUserRateThrottle(UserRateThrottle):
    """
    Burst rate limit for authenticated users.
    Configured via REST_FRAMEWORK settings under the 'burst' scope.
    """
    scope = 'burst'


class StandardAnonRateThrottle(AnonRateThrottle):
    """
    Standard rate limit for anonymous users.
    Configured via REST_FRAMEWORK settings under the 'anon' scope.
    """
    scope = 'anon'


class AuthRateThrottle(AnonRateThrottle):
    """
    Strict rate limit for authentication endpoints to prevent brute-force attacks.
    Configured via REST_FRAMEWORK settings under the 'auth' scope.
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        """
        Custom cache key to throttle by IP and username/email if provided.
        """
        ident = self.get_ident(request)
        # Attempt to get username/email from the request if it's a POST
        username = request.data.get('email') or request.data.get('username')
        if username:
            return self.cache_format % {
                'scope': self.scope,
                'ident': f"{ident}_{username}"
            }
        
        return super().get_cache_key(request, view)

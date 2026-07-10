# yss_orbit\backend\core\auth\token_blacklist.py
"""
YSS Orbit - Token Blacklist
Handles logic for checking and blacklisting JWTs.
"""
from __future__ import annotations

import logging
from django.core.cache import cache
from typing import Optional

logger = logging.getLogger(__name__)


class TokenBlacklist:
    """
    Manages blacklisted tokens using Redis (via Django cache).
    Blacklisted tokens are kept until their natural expiration.
    """
    
    PREFIX = "jwt_blacklist:"

    @classmethod
    def blacklist_token(cls, jti: str, exp_timestamp: int) -> None:
        """
        Add a token JTI to the blacklist until its expiration.
        """
        import time
        now = int(time.time())
        ttl = exp_timestamp - now
        
        if ttl > 0:
            cache.set(f"{cls.PREFIX}{jti}", True, timeout=ttl)
            logger.info(f"Token {jti} blacklisted for {ttl} seconds.")
        else:
            logger.debug(f"Token {jti} already expired, skipping blacklist.")

    @classmethod
    def is_blacklisted(cls, jti: str) -> bool:
        """
        Check if a token JTI is blacklisted.
        """
        return cache.get(f"{cls.PREFIX}{jti}", False) is True

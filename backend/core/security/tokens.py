# yss_orbit\backend\core\security\tokens.py
"""
YSS Orbit - Tokens
Security token generation, validation, and parsing logic.
"""
from __future__ import annotations

import logging
import secrets
import string

logger = logging.getLogger(__name__)


class TokenUtils:
    """
    Utilities for generating secure non-JWT tokens.
    Used for API keys, one-time links, and password resets.
    """

    @staticmethod
    def generate_secure_token(length: int = 48) -> str:
        """
        Generates a cryptographically secure random token.
        Safe for use as an API Key or reset token.
        """
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    def generate_api_key(prefix: str = "yss") -> str:
        """
        Generates an API key with a standard prefix for easy identification.
        Format: yss_live_<random>
        """
        random_part = TokenUtils.generate_secure_token(32)
        return f"{prefix}_{random_part}"

# yss_orbit\backend\core\utils\crypto_utils.py
"""
Crypto utils for the platform.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets

def generate_random_string(length: int = 32) -> str:
    """Generate a cryptographically secure random string."""
    return secrets.token_urlsafe(length)

def generate_hmac_signature(payload: str, secret: str) -> str:
    """Generate a SHA-256 HMAC signature."""
    mac = hmac.new(secret.encode("utf-8"), msg=payload.encode("utf-8"), digestmod=hashlib.sha256)
    return mac.hexdigest()

def hash_string(value: str) -> str:
    """Hash a string using SHA-256."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def encode_base64(value: str) -> str:
    """Encode a string to base64."""
    return base64.b64encode(value.encode("utf-8")).decode("utf-8")

def decode_base64(encoded_value: str) -> str:
    """Decode a base64 string."""
    return base64.b64decode(encoded_value.encode("utf-8")).decode("utf-8")

# yss_orbit\backend\core\utils\uuid_utils.py
"""
UUID utilities.
"""
from __future__ import annotations

import uuid

def generate_uuid() -> uuid.UUID:
    """Generate a standard UUID4."""
    return uuid.uuid4()

def generate_uuid_str() -> str:
    """Generate a UUID4 string."""
    return str(uuid.uuid4())

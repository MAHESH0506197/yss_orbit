# yss_orbit\backend\core\utils\idempotency.py
"""
Idempotency utility helpers.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

def generate_idempotency_key(payload: dict[str, Any]) -> str:
    """
    Generate an idempotency key based on a payload hash.
    Useful when the client doesn't provide an Idempotency-Key header.
    """
    payload_str = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

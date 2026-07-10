# yss_orbit\backend\core\idempotency\__init__.py
"""
Idempotency module init.
"""
from core.utils.idempotency import generate_idempotency_key

__all__ = ["generate_idempotency_key"]

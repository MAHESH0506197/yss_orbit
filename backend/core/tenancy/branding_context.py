# yss_orbit\backend\core\tenancy\branding_context.py
"""
Branding context.
"""
from contextvars import ContextVar
from typing import Optional, Dict, Any

_branding_context: ContextVar[Dict[str, Any]] = ContextVar("branding_context", default={})

def get_branding_context() -> Dict[str, Any]:
    return _branding_context.get().copy()

def set_branding_context(branding_data: dict) -> None:
    _branding_context.set(branding_data)

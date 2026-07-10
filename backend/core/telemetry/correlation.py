# yss_orbit\backend\core\telemetry\correlation.py
"""
Correlation tracking via context variables.
"""
from contextvars import ContextVar
from typing import Optional
import uuid

_correlation_id: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)

def set_correlation_id(cid: str) -> None:
    _correlation_id.set(cid)

def get_correlation_id() -> str:
    cid = _correlation_id.get()
    if not cid:
        cid = str(uuid.uuid4())
        _correlation_id.set(cid)
    return cid

def clear_correlation_id() -> None:
    _correlation_id.set(None)

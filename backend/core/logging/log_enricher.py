# yss_orbit\backend\core\logging\log_enricher.py
"""
Log enricher for attaching request context to logs.
"""
import logging
import threading
from contextvars import ContextVar
from typing import Dict, Any

_log_context: ContextVar[Dict[str, Any]] = ContextVar("log_context", default={})

class ContextFilter(logging.Filter):
    """
    Filter that injects context variables (like correlation_id) into log records.
    """
    def filter(self, record):
        ctx = _log_context.get()
        for key, value in ctx.items():
            setattr(record, key, value)
        return True

def set_log_context(**kwargs):
    """Update the current log context."""
    ctx = _log_context.get().copy()
    ctx.update(kwargs)
    _log_context.set(ctx)

def clear_log_context():
    """Clear the current log context."""
    _log_context.set({})

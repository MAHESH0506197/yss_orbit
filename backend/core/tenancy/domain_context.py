# yss_orbit\backend\core\tenancy\domain_context.py
"""
Domain resolution context.
"""
from contextvars import ContextVar
from typing import Optional

_domain_context: ContextVar[Optional[str]] = ContextVar("domain_context", default=None)

def get_current_domain() -> Optional[str]:
    return _domain_context.get()

def set_domain_context(domain: str) -> None:
    _domain_context.set(domain)

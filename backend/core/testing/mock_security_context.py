# yss_orbit\backend\core\testing\mock_security_context.py
"""
Mock security context for testing.
"""
from contextlib import contextmanager
from core.security.security_context import set_security_context, clear_security_context

@contextmanager
def mock_security_context(user_id: str, tenant_id: str, scopes: list = None):
    set_security_context(
        user_id=user_id,
        tenant_id=tenant_id,
        is_authenticated=True,
        is_superuser=False,
        scopes=set(scopes or [])
    )
    try:
        yield
    finally:
        clear_security_context()

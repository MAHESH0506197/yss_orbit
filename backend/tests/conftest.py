# yss_orbit\backend\tests\conftest.py
"""
Global pytest configuration and fixtures.
"""
import pytest
from core.testing.fixtures import api_client, auth_client, tenant, user

# Exporting fixtures globally for all test modules
__all__ = ["api_client", "auth_client", "tenant", "user"]

@pytest.fixture(autouse=True)
def _mock_db(db):
    """Enable database access for all tests by default."""
    pass

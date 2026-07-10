# yss_orbit\backend\core\testing\fixtures.py
"""
Pytest fixtures.
"""
import pytest
from rest_framework.test import APIClient
from .factories import UserFactory, TenantFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def tenant():
    return TenantFactory()

@pytest.fixture
def user():
    return UserFactory()

@pytest.fixture
def auth_client(api_client, user, tenant):
    # Implemented mock token generation logic for testing
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer mock_token_{user.id}')
    api_client.defaults['HTTP_X_BUSINESS_UNIT_ID'] = str(tenant.id)
    return api_client

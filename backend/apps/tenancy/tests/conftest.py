# yss_orbit\backend\apps\subscription\tests\conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def sample_data():
    return {"name": "test_subscription", "is_active": True}
    
@pytest.fixture
def authenticated_client(api_client):
    # Setup authentication
    return api_client

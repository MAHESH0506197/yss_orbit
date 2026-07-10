# yss_orbit\backend\apps\user_business_unit\tests\conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def organization(tenant_org):
    return tenant_org

# yss_orbit\backend\apps\attendance\tests\conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def tenant_fixture(db):
    from apps.platform.models import Tenant
    return Tenant.objects.create(name="Test Tenant", schema_name="test_tenant")

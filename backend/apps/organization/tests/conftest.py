# yss_orbit\backend\apps\user_business_unit\tests\conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def organization(tenant_org):
    return tenant_org

from apps.organization.models import BusinessDomain
import uuid

@pytest.fixture
def business_domain(db):
    bd, _ = BusinessDomain.objects.get_or_create(
        name="Test Domain " + uuid.uuid4().hex[:8],
        code="TEST" + uuid.uuid4().hex[:4]
    )
    return bd

@pytest.fixture
def org_data(business_domain):
    return {
        "name": "Test Organization",
        "business_domain_id": business_domain.id,
    }

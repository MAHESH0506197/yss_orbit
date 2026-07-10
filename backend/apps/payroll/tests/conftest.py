# yss_orbit\backend\apps\payroll\tests\conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def business_unit_id():
    import uuid
    return uuid.uuid4()

@pytest.fixture
def user_id():
    import uuid
    return uuid.uuid4()

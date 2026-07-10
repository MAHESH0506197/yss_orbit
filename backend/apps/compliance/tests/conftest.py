# yss_orbit\backend\apps\error_log\tests\conftest.py
import pytest

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

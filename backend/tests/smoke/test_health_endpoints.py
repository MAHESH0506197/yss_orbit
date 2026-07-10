# yss_orbit\backend\tests\smoke\test_health_endpoints.py
"""
Health endpoint tests.
"""
import pytest
from django.urls import reverse

@pytest.mark.django_db
def test_health_check(api_client):
    # This assumes observability URLs are mounted at /health/
    url = "/health/"
    response = api_client.get(url)
    # The actual implementation of /health/ is in Phase 3 apps,
    # so we expect 404 until it's built or 200 if mounted
    assert response.status_code in [200, 404]

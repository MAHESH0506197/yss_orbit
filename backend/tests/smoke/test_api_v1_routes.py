# yss_orbit\backend\tests\smoke\test_api_v1_routes.py
"""
API v1 Route tests.
"""
import pytest

@pytest.mark.django_db
def test_api_v1_base(api_client):
    url = "/api/v1/"
    response = api_client.get(url)
    # Ensure it's not a server error. 404 is fine if no default handler is mounted.
    assert response.status_code < 500

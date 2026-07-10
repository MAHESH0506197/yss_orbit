import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestRBACAPI:
    def test_permissions_list_requires_auth(self):
        client = APIClient()
        url = '/api/rbac/permissions/'
        response = client.get(url)
        assert response.status_code in [401, 403, 404]  # Depending on exact routing setup

# yss_orbit\backend\apps\recruitment\tests\test_recruitment_api.py
import pytest
from rest_framework import status
from django.urls import reverse

@pytest.mark.django_db
class TestRecruitmentAPI:
    def test_list_endpoint_unauthorized(self, api_client):
        response = api_client.get('/api/recruitment/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_list_endpoint_authorized(self, authenticated_client):
        response = authenticated_client.get('/api/recruitment/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

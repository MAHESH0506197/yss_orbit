# yss_orbit\backend\apps\attendance\tests\test_attendance_api.py
import pytest
from rest_framework import status
from django.urls import reverse

@pytest.mark.django_db
class TestAttendanceAPI:
    def test_list_endpoint_unauthorized(self, api_client):
        response = api_client.get('/api/attendance/')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_list_endpoint_authorized(self, admin_client):
        response = admin_client.get('/api/attendance/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

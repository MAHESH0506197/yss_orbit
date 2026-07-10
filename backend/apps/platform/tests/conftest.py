# yss_orbit\backend\apps\support\tests\conftest.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    return api_client

@pytest.fixture
def test_user(db):
    user, created = User.objects.get_or_create(username='testuser', email='test@example.com')
    if created:
        user.set_password('testpass123')
        user.save()
    return user

# yss_orbit\backend\apps\tenancy\tests\test_middleware.py
import pytest
import uuid
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from apps.tenancy.middleware import TenantMiddleware
from apps.iam.models import User
from django.http import HttpResponse

def dummy_get_response(request):
    return HttpResponse("OK")

@pytest.fixture
def middleware():
    return TenantMiddleware(get_response=dummy_get_response)

@pytest.fixture
def rf():
    return RequestFactory()

@pytest.mark.django_db
class TestTenantMiddleware:
    def test_unauthenticated_request(self, middleware, rf):
        request = rf.get("/api/v1/some-endpoint/")
        request.user = AnonymousUser()
        
        response = middleware(request)
        assert getattr(request, "business_unit_id", None) is None
        assert response.status_code == 200

    def test_authenticated_with_valid_header(self, middleware, rf):
        bu_id = uuid.uuid4()
        request = rf.get("/api/v1/some-endpoint/", HTTP_X_BUSINESS_UNIT_ID=str(bu_id))
        user = User.objects.create(username="test", email="test@test.com")
        request.user = user
        
        response = middleware(request)
        assert request.business_unit_id == bu_id
        assert response.status_code == 200

    def test_authenticated_with_invalid_header(self, middleware, rf):
        request = rf.get("/api/v1/some-endpoint/", HTTP_X_BUSINESS_UNIT_ID="invalid-uuid")
        user = User.objects.create(username="test2", email="test2@test.com")
        request.user = user
        
        response = middleware(request)
        assert request.business_unit_id is None
        assert response.status_code == 200

    def test_authenticated_missing_header(self, middleware, rf):
        request = rf.get("/api/v1/some-endpoint/")
        user = User.objects.create(username="test3", email="test3@test.com")
        request.user = user
        
        response = middleware(request)
        assert request.business_unit_id is None
        assert response.status_code == 200

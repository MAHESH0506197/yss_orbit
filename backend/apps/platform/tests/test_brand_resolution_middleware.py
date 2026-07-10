import pytest
from django.test import RequestFactory
from django.core.cache import cache
from apps.platform.middleware.brand_resolution import BrandResolutionMiddleware
from apps.platform.models.brand_configuration import BrandConfiguration
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessDomain

pytestmark = pytest.mark.django_db

@pytest.fixture
def rf():
    return RequestFactory()

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()

def test_platform_fallback(rf):
    request = rf.get('/', HTTP_HOST='unknown.yssorbit.com')
    middleware = BrandResolutionMiddleware(get_response=lambda r: r)
    middleware.process_request(request)
    
    assert request.brand_context["found"] is False
    assert request.brand_context["company_name"] == "YSS Orbit"

def test_organization_fallback(rf):
    domain, _ = BusinessDomain.objects.get_or_create(name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4])
    org = Organization.objects.create(name="Acme Corp", slug="acme", business_domain=domain, is_active=True)
    BrandConfiguration.objects.create(
        organization=org,
        company_name="Acme Brand",
        branding_mode="co_brand",
        is_active=True
    )
    
    request = rf.get('/', HTTP_HOST='acme.yssorbit.com')
    middleware = BrandResolutionMiddleware(get_response=lambda r: r)
    middleware.process_request(request)
    
    assert request.brand_context["found"] is True
    assert request.brand_context["company_name"] == "Acme Brand"
    assert request.brand_context["mode"] == "co_brand"
    assert request.brand_context["is_suspended"] is False

def test_domain_verification_pending(rf):
    domain, _ = BusinessDomain.objects.get_or_create(name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4])
    org = Organization.objects.create(name="Acme Corp", slug="acme", business_domain=domain, is_active=True)
    BrandConfiguration.objects.create(
        organization=org,
        company_name="Acme Custom",
        custom_domain="hr.acmecorp.com",
        domain_status=BrandConfiguration.DomainStatus.PENDING,
        is_active=True
    )
    
    request = rf.get('/', HTTP_HOST='hr.acmecorp.com')
    middleware = BrandResolutionMiddleware(get_response=lambda r: r)
    middleware.process_request(request)
    
    assert request.brand_context["found"] is False

def test_custom_domain_success(rf):
    domain, _ = BusinessDomain.objects.get_or_create(name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4])
    org = Organization.objects.create(name="Acme Corp", slug="acme", business_domain=domain, is_active=True)
    BrandConfiguration.objects.create(
        organization=org,
        company_name="Acme Custom Verified",
        custom_domain="hr.acmecorp.com",
        domain_status=BrandConfiguration.DomainStatus.VERIFIED,
        branding_mode="white_label",
        is_active=True
    )
    
    request = rf.get('/', HTTP_HOST='hr.acmecorp.com')
    middleware = BrandResolutionMiddleware(get_response=lambda r: r)
    middleware.process_request(request)
    
    assert request.brand_context["found"] is True
    assert request.brand_context["mode"] == "white_label"
    assert request.brand_context["company_name"] == "Acme Custom Verified"

def test_suspended_organization(rf):
    domain, _ = BusinessDomain.objects.get_or_create(name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4])
    org = Organization.objects.create(name="Bad Corp", slug="bad", business_domain=domain, is_active=False)
    BrandConfiguration.objects.create(
        organization=org,
        company_name="Bad Brand",
        is_active=True
    )
    
    request = rf.get('/', HTTP_HOST='bad.yssorbit.com')
    middleware = BrandResolutionMiddleware(get_response=lambda r: r)
    middleware.process_request(request)
    
    assert request.brand_context["found"] is True
    assert request.brand_context["is_suspended"] is True

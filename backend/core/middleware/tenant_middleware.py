# yss_orbit\backend\core\middleware\tenant_middleware.py
"""
Tenant resolution middleware.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from django.core.exceptions import ImproperlyConfigured
from core.exceptions import TenantNotFoundException
from core.tenancy.tenant_context import set_tenant_context, clear_tenant_context
from apps.organization.models.organization_model import Organization

class TenantMiddleware:
    """
    Resolves the tenant for the current request using the X-Business-Unit-Id header
    or a subdomain/custom domain.
    """
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        tenant_id = request.headers.get("X-Business-Unit-Id")
        if not tenant_id:
            # For paths that do not require tenant context, allow passthrough
            return self.get_response(request)

        try:
            # Caching would be applied here in a real scenario
            tenant = Organization.objects.get(id=tenant_id, is_active=True)
            request.tenant = tenant
            set_tenant_context(tenant_id=str(tenant.id))
        except Organization.DoesNotExist:
            raise TenantNotFoundException()

        try:
            response = self.get_response(request)
            return response
        finally:
            clear_tenant_context()

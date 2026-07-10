# yss_orbit\backend\core\tenancy\tenant_resolver.py
"""
Resolver for identifying the current tenant from the request.
"""
from django.http import HttpRequest
from core.exceptions import TenantNotFoundException

class TenantResolver:
    @staticmethod
    def resolve_from_request(request: HttpRequest) -> str:
        """
        Extract tenant ID from header or domain.
        Throws TenantNotFoundException if missing.
        """
        tenant_id = request.headers.get("X-Business-Unit-Id")
        if not tenant_id:
            raise TenantNotFoundException("Missing X-Business-Unit-Id header.")
        return tenant_id

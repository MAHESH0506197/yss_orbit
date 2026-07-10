# yss_orbit\backend\core\middleware\branding_middleware.py
"""
Branding middleware for multi-tenant white-labeling.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from core.tenancy.branding_context import set_branding_context

class BrandingMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # In a real app, we'd fetch branding config based on tenant/domain
        set_branding_context({"theme": "light", "logo": "/default.png"})
        return self.get_response(request)

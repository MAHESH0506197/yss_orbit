# yss_orbit\backend\core\middleware\security_headers_middleware.py
"""
Security Headers middleware.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse

class SecurityHeadersMiddleware:
    """
    Injects enterprise security headers (HSTS, CSP, X-Content-Type-Options).
    """
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        return response

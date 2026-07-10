# yss_orbit\backend\core\audit\audit_middleware.py
"""
Middleware to initialize audit context per request.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from .audit_context import set_audit_context, clear_audit_context

class AuditMiddleware:
    """
    Extracts user, tenant, IP, and User-Agent from the request
    and places them into the Audit Context for the duration of the request.
    """
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # User and Tenant are typically set by Auth/Tenant middleware before this.
        # But we capture IP and User Agent here.
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # We set what we know initially.
        set_audit_context(
            ip_address=ip,
            user_agent=user_agent
        )
        
        try:
            response = self.get_response(request)
            return response
        finally:
            clear_audit_context()

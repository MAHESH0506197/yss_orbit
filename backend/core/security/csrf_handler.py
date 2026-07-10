# yss_orbit\backend\core\security\csrf_handler.py
"""
YSS Orbit - CSRF Handler
Manages Cross-Site Request Forgery protections.
"""
from __future__ import annotations

import logging
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.decorators import decorator_from_middleware
from django.views.decorators.csrf import csrf_exempt, csrf_protect, requires_csrf_token

logger = logging.getLogger(__name__)

class API_CSRFMiddleware(CsrfViewMiddleware):
    """
    Custom CSRF Middleware tailored for the API.
    Can be adjusted to read CSRF tokens from custom headers if needed.
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        """
        Override to add custom logic, e.g., bypassing CSRF for specific API routes
        or server-to-server communication based on authentication.
        """
        if getattr(request, "_dont_enforce_csrf_checks", False):
            return self._accept(request)

        # Allow programmatic API clients that authenticate with Bearer tokens
        if request.headers.get("Authorization", "").startswith("Bearer "):
            return self._accept(request)

        return super().process_view(request, callback, callback_args, callback_kwargs)

def apply_csrf(view_func):
    """
    Decorator to apply CSRF protection to a specific view function.
    """
    return decorator_from_middleware(API_CSRFMiddleware)(view_func)

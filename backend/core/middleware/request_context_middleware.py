# yss_orbit\backend\core\middleware\request_context_middleware.py
"""
Request context middleware.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from core.logging.log_enricher import set_log_context

class RequestContextMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        set_log_context(
            path=request.path,
            method=request.method,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return self.get_response(request)

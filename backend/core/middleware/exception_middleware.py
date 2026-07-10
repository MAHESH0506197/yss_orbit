# yss_orbit\backend\core\middleware\exception_middleware.py
"""
Global exception capturing middleware.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse
from core.logging.error_logger import log_error

class ExceptionMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        try:
            return self.get_response(request)
        except Exception as e:
            log_error(e, context={"path": request.path})
            raise

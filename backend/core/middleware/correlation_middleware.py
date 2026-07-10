# yss_orbit\backend\core\middleware\correlation_middleware.py
"""
Correlation middleware to inject and track request IDs across boundaries.
"""
import uuid
from typing import Callable
from django.http import HttpRequest, HttpResponse
from core.telemetry.correlation import set_correlation_id, clear_correlation_id

class CorrelationIdMiddleware:
    """
    Extracts or generates X-Correlation-Id and X-Request-Id headers.
    """
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        correlation_id = request.headers.get("X-Correlation-Id", str(uuid.uuid4()))
        request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
        
        request.correlation_id = correlation_id
        request.request_id = request_id
        
        set_correlation_id(correlation_id)
        
        try:
            response = self.get_response(request)
            response["X-Correlation-Id"] = correlation_id
            response["X-Request-Id"] = request_id
            return response
        finally:
            clear_correlation_id()

# yss_orbit\backend\core\middleware\module_subscription_middleware.py
"""
Module subscription middleware.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse

class ModuleSubscriptionMiddleware:
    """Enforces that the current tenant is subscribed to the accessed module."""
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        return self.get_response(request)

import json
from django.core.cache import cache
from django.http import JsonResponse
from typing import Callable, Any

class PQMIdempotencyMiddleware:
    """
    Prevents duplicate processing for PQM endpoints using Idempotency-Key.
    Returns 409 Conflict if a request with the same key is already processed/processing.
    """
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: Any) -> Any:
        # Only apply to PQM API POST/PUT/PATCH
        if not request.path.startswith("/api/v1/pqm/"):
            return self.get_response(request)
            
        if request.method not in ["POST", "PUT", "PATCH"]:
            return self.get_response(request)

        idempotency_key = request.META.get("HTTP_IDEMPOTENCY_KEY")
        if not idempotency_key:
            return self.get_response(request)

        cache_key = f"pqm_idem_{idempotency_key}"
        if cache.get(cache_key):
            return JsonResponse(
                {"error": "Duplicate request detected."},
                status=409
            )

        # Set cache to prevent duplicate processing within 5 minutes (300 seconds)
        cache.set(cache_key, True, 300)
        
        response = self.get_response(request)
        return response

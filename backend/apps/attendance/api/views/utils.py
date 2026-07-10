# yss_orbit\backend\apps\attendance\api\views\utils.py
from __future__ import annotations
from rest_framework import status
from rest_framework.request import Request
from apps.platform.core_response import error_response
from apps.iam.security_context import SecurityContext

def _get_sc(request: Request) -> tuple[SecurityContext | None, any]:
    sc = getattr(request, "security_context", None)
    if not sc:
        return None, error_response(
            "UNAUTHORIZED", "Security context not found on request.",
            http_status=status.HTTP_401_UNAUTHORIZED, request=request,
        )
    return sc, None

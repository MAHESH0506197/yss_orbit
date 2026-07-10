from __future__ import annotations
import uuid
from rest_framework import status
from rest_framework.request import Request
from apps.platform.core_response import error_response


def _get_bu_id(request: Request) -> uuid.UUID | None:
    # Strict Tenant Isolation Rule: 
    # Never trust user-supplied headers directly. 
    # Always use the resolved business_unit_id from the security context.
    if hasattr(request, "security_context") and request.security_context:
        return request.security_context.business_unit_id
    
    # Legacy fallback only if security_context middleware isn't active on this route
    bu_str = request.headers.get("X-Business-Unit-Id") or getattr(request.user, "business_unit_id", None)
    if bu_str:
        try:
            return uuid.UUID(str(bu_str))
        except (ValueError, TypeError):
            return None
    return None


def _require_bu(request: Request):
    bu_id = _get_bu_id(request)
    if not bu_id:
        return None, error_response(
            "MISSING_BUSINESS_UNIT",
            "X-Business-Unit-ID header is required.",
            http_status=status.HTTP_400_BAD_REQUEST,
            request=request,
        )
    return bu_id, None

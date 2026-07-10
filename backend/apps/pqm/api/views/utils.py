# yss_orbit\backend\apps\pqm\api\views\utils.py
"""Shared view utilities for PQM — mirrors hrms/api/views/utils.py pattern."""
from __future__ import annotations

import uuid
from rest_framework import status
from rest_framework.request import Request
from apps.platform.core_response import error_response


def _get_bu_id(request: Request) -> uuid.UUID | None:
    # Primary: use resolved security_context (set by TenantMiddleware)
    if hasattr(request, "security_context") and request.security_context:
        return request.security_context.business_unit_id
    # Fallback: X-Business-Unit-Id header
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


def _get_org_id(request: Request) -> uuid.UUID | None:
    if hasattr(request, "security_context") and request.security_context:
        org_id = getattr(request.security_context, "organization_id", None)
        if org_id:
            return org_id
    org_id = getattr(request.user, "organization_id", None)
    if org_id:
        return org_id
    
    # Fallback: resolve from BU ID
    bu_id = _get_bu_id(request)
    if bu_id:
        from apps.organization.models.business_unit_model import BusinessUnit
        bu = BusinessUnit.objects.filter(id=bu_id).first()
        if bu:
            return bu.organization_id
    return None

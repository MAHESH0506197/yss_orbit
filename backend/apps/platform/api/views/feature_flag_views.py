# yss_orbit\backend\apps\feature_flags\views.py
"""
YSS Orbit — Feature Flag Views
Admin-facing API to list/inspect feature flags.
Evaluation endpoint for frontend to check flag status.
"""
from __future__ import annotations

import logging
import uuid

from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_permissions import IsAuthenticated, IsSuperAdmin
from apps.platform.core_response import success_response, error_response
from apps.platform.models import FeatureFlag
from apps.platform.services.feature_flag_service import FeatureFlagService

logger = logging.getLogger(__name__)


from apps.platform.api.serializers.feature_flag_serializers import FeatureFlagSerializer


class FeatureFlagListView(APIView):
    """
    GET  /api/v1/feature-flags/         → List all flags (super-admin only)
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request: Request) -> Response:
        flags = FeatureFlag.objects.all().order_by("code")
        serializer = FeatureFlagSerializer(flags, many=True)
        return success_response(data=serializer.data, request=request)


class FeatureFlagEvaluateView(APIView):
    """
    GET /api/v1/feature-flags/evaluate/?code=<flag_code>&organization_id=<uuid>
    Returns {"enabled": true/false} for the given flag + org combination.
    Used by frontend to gate UI features.
    Requires authentication — no super-admin restriction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        flag_code = request.query_params.get("code", "").strip()
        org_id_param = request.query_params.get("organization_id", "").strip()

        if not flag_code:
            return error_response(
                error_code="FF_001",
                message="'code' query parameter is required.",
                http_status=400,
                request=request,
            )

        org_id: uuid.UUID | None = None
        if org_id_param:
            try:
                org_id = uuid.UUID(org_id_param)
            except ValueError:
                return error_response(
                    error_code="FF_002",
                    message="Invalid organization_id format.",
                    http_status=400,
                    request=request,
                )

        enabled = FeatureFlagService.is_enabled(flag_code, org_id)
        return success_response(
            data={"code": flag_code, "enabled": enabled},
            request=request,
        )


class FeatureFlagBulkEvaluateView(APIView):
    """
    POST /api/v1/feature-flags/evaluate/bulk/
    Body: {"codes": ["flag1", "flag2"], "organization_id": "<uuid>"}
    Returns: {"results": {"flag1": true, "flag2": false}}
    Allows frontend to batch-check multiple flags in a single request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        codes = request.data.get("codes", [])
        org_id_param = request.data.get("organization_id", "")

        if not isinstance(codes, list) or not codes:
            return error_response(
                error_code="FF_003",
                message="'codes' must be a non-empty list.",
                http_status=400,
                request=request,
            )

        if len(codes) > 50:
            return error_response(
                error_code="FF_004",
                message="Maximum 50 flags per bulk request.",
                http_status=400,
                request=request,
            )

        org_id: uuid.UUID | None = None
        if org_id_param:
            try:
                org_id = uuid.UUID(str(org_id_param))
            except ValueError:
                return error_response(
                    error_code="FF_002",
                    message="Invalid organization_id format.",
                    http_status=400,
                    request=request,
                )

        results = {
            code: FeatureFlagService.is_enabled(code, org_id)
            for code in codes
        }
        return success_response(data={"results": results}, request=request)

# yss_orbit\backend\apps\jobs\views.py
"""
YSS Orbit — Background Jobs Views
Frontend polls these endpoints to check job status.
Also used by SSE to notify completion.
"""
from __future__ import annotations

import logging
import uuid

from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_permissions import IsAuthenticated
from apps.platform.core_response import error_response, success_response
from apps.platform.models import BackgroundJob

logger = logging.getLogger(__name__)


from apps.platform.api.serializers.job_serializers import BackgroundJobSerializer


class JobDetailView(APIView):
    """
    GET /api/v1/jobs/{job_id}/
    Returns the current status of a background job.
    User must own the job (or be super-admin).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, job_id: str) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]

        try:
            jid = uuid.UUID(job_id)
        except ValueError:
            return error_response(
                error_code="JOB_001",
                message="Invalid job ID format.",
                http_status=400,
                request=request,
            )

        try:
            job = BackgroundJob.objects.get(id=jid)
        except BackgroundJob.DoesNotExist:
            return error_response(
                error_code="JOB_002",
                message="Job not found.",
                http_status=404,
                request=request,
            )

        # Access control: must own the job or be super-admin
        if not ctx.is_super_admin and str(job.triggered_by_id) != str(ctx.user_id):
            return error_response(
                error_code="JOB_003",
                message="Job not found.",
                http_status=404,
                request=request,
            )

        serializer = BackgroundJobSerializer(job)
        return success_response(data=serializer.data, request=request)


class JobListView(APIView):
    """
    GET /api/v1/jobs/
    Lists recent background jobs for the authenticated user in the BU.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id = getattr(request, "business_unit_id", None)

        qs = BackgroundJob.objects.filter(triggered_by_id=ctx.user_id)
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        qs = qs.order_by("-created_at")[:50]

        serializer = BackgroundJobSerializer(qs, many=True)
        return success_response(data=serializer.data, request=request)

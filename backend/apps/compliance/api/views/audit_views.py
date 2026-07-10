# yss_orbit\backend\apps\audit\views.py
"""
YSS Orbit — Audit Log Views
Exposes audit trail for platform admins and business unit admins.
Read-only — audit logs are immutable.
"""
from __future__ import annotations

import logging
import uuid

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.compliance.models import AuditLog
from apps.compliance.api.serializers.audit_serializers import AuditLogSerializer
from apps.platform.core_pagination import CursorResultsPagination
from apps.platform.core_permissions import IsAuthenticated, IsSuperAdmin
from apps.platform.core_response import success_response

logger = logging.getLogger(__name__)


class AuditLogListView(APIView):
    """
    GET /api/v1/audit/
    List audit logs for a business unit. Requires admin permission.
    Supports cursor-based pagination. Filtered by business_unit_id from header.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        ctx = request.security_context  # type: ignore[attr-defined]
        bu_id = getattr(request, "business_unit_id", None)

        # Super-admins can query all; regular users need a BU
        if ctx.is_super_admin:
            qs = AuditLog.objects.all()
            if bu_id:
                qs = qs.filter(business_unit_id=bu_id)
        else:
            if bu_id is None:
                return success_response(data={"results": [], "count": 0}, request=request)
            ctx.require_permission("audit.logs.view")
            qs = AuditLog.objects.filter(business_unit_id=bu_id)

        # Filtering
        action = request.query_params.get("action")
        resource_type = request.query_params.get("resource_type")
        user_id_param = request.query_params.get("user_id")

        if action:
            qs = qs.filter(action=action)
        if resource_type:
            qs = qs.filter(resource_type=resource_type)
        if user_id_param:
            try:
                qs = qs.filter(user_id=uuid.UUID(user_id_param))
            except ValueError:
                pass

        qs = qs.order_by("-created_at")

        paginator = CursorResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AuditLogSerializer(qs[:100], many=True)
        return success_response(data=serializer.data, request=request)

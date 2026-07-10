# yss_orbit\backend\apps\pqm\api\views\comment_views.py
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, error_response
from apps.pqm.models import NonConformance
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.comment_serializer import CommentSerializer
from apps.pqm.api.views.utils import _require_bu


class NCCommentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.VIEW_COMMENTS):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        qs = nc.comments.filter(is_deleted=False).order_by("created_at")
        return success_response(data=CommentSerializer(qs, many=True).data, request=request)

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.COMMENT_NC):
            return error_response("PQM_FORBIDDEN", "No permission to comment.", http_status=403, request=request)

        try:
            nc = NonConformance.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False)
        except NonConformance.DoesNotExist:
            return error_response("NC_NOT_FOUND", "NC not found.", http_status=404, request=request)

        data = dict(request.data)
        data["nc"] = str(nc.id)
        serializer = CommentSerializer(data=data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid comment.", details=serializer.errors, http_status=400, request=request)

        comment = serializer.save(
            author_id=request.user.id,
            organization_id=nc.organization_id,
            business_unit_id=nc.business_unit_id,
        )
        return created_response(data=CommentSerializer(comment).data, request=request)

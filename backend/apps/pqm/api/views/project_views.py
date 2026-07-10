# yss_orbit\backend\apps\pqm\api\views\project_views.py
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
import math
from django.db.models import Q

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.pqm.models import PQMProject
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.project_serializer import PQMProjectSerializer
from apps.pqm.api.views.utils import _require_bu, _get_org_id


class PQMProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        qs_all = PQMProject.all_objects.filter(business_unit_id=bu_id)

        # Meta counters
        total = qs_all.filter(is_deleted=False).count()
        total_active = qs_all.filter(is_active=True, is_deleted=False).count()
        total_inactive = qs_all.filter(is_active=False, is_deleted=False).count()
        total_deleted = qs_all.filter(is_deleted=True).count()
        
        # Filtering
        status_filter = request.query_params.get("status", "all")
        if status_filter == "deleted":
            qs = qs_all.filter(is_deleted=True)
        elif status_filter == "active":
            qs = qs_all.filter(is_active=True, is_deleted=False)
        elif status_filter == "inactive":
            qs = qs_all.filter(is_active=False, is_deleted=False)
        else:
            qs = qs_all.filter(is_deleted=False)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search))

        # Ordering
        ordering = request.query_params.get("ordering", "name")
        valid_orderings = {"name", "-name", "code", "-code", "created_at", "-created_at", "is_active", "-is_active"}
        if ordering in valid_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        # Pagination
        try:
            page = int(request.query_params.get("page", 1))
            page_size = int(request.query_params.get("page_size", 20))
        except ValueError:
            page = 1
            page_size = 20

        count = qs.count()
        total_pages = math.ceil(count / page_size) if count > 0 else 1
        page = max(1, min(page, total_pages))
        
        start = (page - 1) * page_size
        end = start + page_size
        qs = qs[start:end]

        data = {
            "results": PQMProjectSerializer(qs, many=True).data,
            "meta": {
                "total": total,
                "total_active": total_active,
                "total_inactive": total_inactive,
                "total_deleted": total_deleted,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
            }
        }
        return success_response(data=data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission to create projects.", http_status=403, request=request)
        serializer = PQMProjectSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        obj = serializer.save(
            organization_id=_get_org_id(request), 
            business_unit_id=bu_id, 
            created_by_id=request.user.id,
            created_reason=request.data.get("reason", "")
        )
        return created_response(data=PQMProjectSerializer(obj).data, request=request)


class PQMProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, bu_id):
        try:
            return PQMProject.all_objects.get(id=pk, business_unit_id=bu_id), None
        except PQMProject.DoesNotExist:
            return None, "Project not found."

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        return success_response(data=PQMProjectSerializer(obj).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        if obj.is_deleted:
            return error_response("BAD_REQUEST", "Cannot modify an archived project.", http_status=400, request=request)
        serializer = PQMProjectSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        serializer.save(
            updated_by_id=request.user.id,
            updated_reason=request.data.get("reason", "")
        )
        return success_response(data=serializer.data, request=request)

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        
        reason = request.data.get("reason", "")
        obj.soft_delete(deleted_by_id=request.user.id, deleted_reason=reason)
        return no_content_response(request=request)

class PQMProjectRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        try:
            obj = PQMProject.all_objects.get(id=pk, business_unit_id=bu_id)
        except PQMProject.DoesNotExist:
            return error_response("NOT_FOUND", "Project not found.", http_status=404, request=request)
        
        if not obj.is_deleted:
            return error_response("BAD_REQUEST", "Project is not archived.", http_status=400, request=request)
        
        obj.restore()
        # Optionally capture a restore reason? We'll just restore for now.
        return success_response(data=PQMProjectSerializer(obj).data, request=request)

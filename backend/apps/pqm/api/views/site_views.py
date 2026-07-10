# yss_orbit\backend\apps\pqm\api\views\site_views.py
from __future__ import annotations

import uuid

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.pqm.models import PQMSite
from apps.pqm.permissions import PQMPermission
from apps.pqm.api.serializers.site_serializer import PQMSiteSerializer
from apps.pqm.api.views.utils import _require_bu, _get_org_id


class PQMSiteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        qs = PQMSite.objects.filter(business_unit_id=bu_id, is_deleted=False)
        project_id = request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        qs = qs.order_by("name")
        return success_response(data=PQMSiteSerializer(qs, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission to create sites.", http_status=403, request=request)
        serializer = PQMSiteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        obj = serializer.save(organization_id=_get_org_id(request), business_unit_id=bu_id, created_by_id=request.user.id)
        return created_response(data=PQMSiteSerializer(obj).data, request=request)


class PQMSiteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, bu_id):
        try:
            return PQMSite.objects.get(id=pk, business_unit_id=bu_id, is_deleted=False), None
        except PQMSite.DoesNotExist:
            return None, "Site not found."

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        return success_response(data=PQMSiteSerializer(obj).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        if not PQMPermission.check_permission(request, PQMPermission.MANAGE_CONFIG):
            return error_response("PQM_FORBIDDEN", "No permission.", http_status=403, request=request)
        obj, err_msg = self._get(pk, bu_id)
        if err_msg:
            return error_response("NOT_FOUND", err_msg, http_status=404, request=request)
        serializer = PQMSiteSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("PQM_VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        serializer.save(updated_by_id=request.user.id)
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
        obj.soft_delete(deleted_by_id=request.user.id)
        return no_content_response(request=request)

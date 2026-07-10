# yss_orbit\backend\apps\hrms\api\views\designation_view.py
from __future__ import annotations

import uuid
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.hrms.api.serializers import DesignationSerializer
from apps.hrms.services.hrms_service import HRMSService
from .utils import _require_bu

_service = HRMSService()


class DesignationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        dept_id = request.query_params.get("department_id")
        desigs = _service.list_designations(bu_id, dept_id)
        return success_response(data=DesignationSerializer(desigs, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        serializer = DesignationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        desig = _service.create_designation(bu_id, serializer.validated_data, request.user.id)
        return created_response(data=DesignationSerializer(desig).data, request=request)


class DesignationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            desig = _service.get_designation(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Designation not found.", http_status=404, request=request)
        return success_response(data=DesignationSerializer(desig).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            desig = _service.get_designation(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Designation not found.", http_status=404, request=request)
        serializer = DesignationSerializer(desig, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        updated = _service.update_designation(bu_id, pk, serializer.validated_data, request.user.id)
        return success_response(data=DesignationSerializer(updated).data, request=request)

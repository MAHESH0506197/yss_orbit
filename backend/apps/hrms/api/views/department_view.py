# yss_orbit\backend\apps\hrms\api\views\department_view.py
from __future__ import annotations

import uuid
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.hrms.api.serializers import DepartmentSerializer
from apps.hrms.services.hrms_service import HRMSService
from .utils import _require_bu

_service = HRMSService()


class DepartmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        depts = _service.list_departments(bu_id)
        return success_response(data=DepartmentSerializer(depts, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        serializer = DepartmentSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        dept = _service.create_department(bu_id, serializer.validated_data, request.user.id)
        return created_response(data=DepartmentSerializer(dept).data, request=request)


class DepartmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            dept = _service.get_department(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Department not found.", http_status=404, request=request)
        return success_response(data=DepartmentSerializer(dept).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            dept = _service.get_department(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Department not found.", http_status=404, request=request)
        serializer = DepartmentSerializer(dept, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        updated = _service.update_department(bu_id, pk, serializer.validated_data, request.user.id)
        return success_response(data=DepartmentSerializer(updated).data, request=request)

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            _service.deactivate_department(bu_id, pk, request.user.id)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Department not found.", http_status=404, request=request)
        return no_content_response(request=request)

from __future__ import annotations

import uuid
import datetime
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
import os

from apps.platform.core_response import success_response, created_response, no_content_response, error_response
from apps.hrms.api.serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer, EmployeeCreateSerializer,
    EmployeeDocumentSerializer
)
from apps.hrms.services.hrms_service import HRMSService
from .utils import _require_bu

_service = HRMSService()


class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        filters = {
            "search": request.query_params.get("search"),
            "department_id": request.query_params.get("department_id"),
            "employment_status": request.query_params.get("employment_status"),
            "employment_type": request.query_params.get("employment_type"),
        }
        employees = _service.list_employees(bu_id, filters)
        
        # Calculate KPIs
        from django.db.models import Count, Q
        from apps.hrms.models import Employee
        qs = Employee.objects.filter(business_unit_id=bu_id)
        
        meta = {
            "total": qs.count(),
            "active": qs.filter(employment_status=Employee.EmploymentStatus.ACTIVE).count(),
            "inactive": qs.exclude(employment_status=Employee.EmploymentStatus.ACTIVE).count(),
            "on_probation": qs.filter(probation_end_date__isnull=False).count(),
            "resigned": qs.filter(employment_status=Employee.EmploymentStatus.RESIGNED).count(),
            "new_joiners": qs.filter(date_of_joining__month=datetime.datetime.now().month).count(),
        }

        return success_response(data=EmployeeListSerializer(employees, many=True).data, meta=meta, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        serializer = EmployeeCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        emp = _service.create_employee(bu_id, serializer.validated_data, request.user.id)
        return created_response(data=EmployeeDetailSerializer(emp).data, request=request)


class EmployeeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            emp = _service.get_employee(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Employee not found.", http_status=404, request=request)
        return success_response(data=EmployeeDetailSerializer(emp).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            emp = _service.get_employee(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Employee not found.", http_status=404, request=request)

        # Self-edit block for sensitive fields
        if str(emp.user_id) == str(request.user.id):
            sensitive_fields = ['salary', 'designation_id', 'department_id', 'reporting_manager_id', 'employment_status', 'employment_type']
            for field in sensitive_fields:
                if field in request.data:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied(f"You cannot modify your own {field}.")

        serializer = EmployeeDetailSerializer(emp, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        updated = _service.update_employee(bu_id, pk, serializer.validated_data, request.user.id)
        return success_response(data=EmployeeDetailSerializer(updated).data, request=request)

    def delete(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        try:
            _service.deactivate_employee(bu_id, pk, request.user.id)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Employee not found.", http_status=404, request=request)
        return no_content_response(request=request)


class EmployeeDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        docs = _service.list_documents(bu_id, emp_pk)
        return success_response(data=EmployeeDocumentSerializer(docs, many=True).data, request=request)

    def post(self, request: Request, emp_pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
        serializer = EmployeeDocumentSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        try:
            doc = _service.create_document(bu_id, emp_pk, serializer.validated_data, request.user.id)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Employee not found.", http_status=404, request=request)
        return created_response(data=EmployeeDocumentSerializer(doc).data, request=request)

class EmployeePhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err: return err
        try:
            emp = _service.get_employee(bu_id, pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Employee not found.", http_status=404, request=request)
        
        file_obj = request.FILES.get("photo")
        if not file_obj:
            return error_response("VALIDATION_ERROR", "No photo provided.", http_status=400, request=request)
        
        if file_obj.size > 5 * 1024 * 1024:
            return error_response("VALIDATION_ERROR", "File size must be under 5MB.", http_status=400, request=request)
        if not file_obj.content_type.startswith("image/"):
            return error_response("VALIDATION_ERROR", "File must be an image.", http_status=400, request=request)
            
        ext = os.path.splitext(file_obj.name)[1]
        file_path = default_storage.save(f"employee_photos/{pk}{ext}", file_obj)
        file_url = default_storage.url(file_path)
        
        emp.photo_url = file_url
        emp.save(update_fields=["photo_url"])
        
        return success_response(data={"photo_url": file_url}, request=request)
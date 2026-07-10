# yss_orbit\backend\apps\attendance\api\views\shift_view.py
from __future__ import annotations
import uuid
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.platform.core_response import success_response, created_response, error_response
from apps.attendance.api.serializers import ShiftSerializer
from apps.hrms.services.attendance_service import AttendanceService
from .utils import _get_sc

_service = AttendanceService()

class ShiftListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        shifts = _service.list_shifts(security_context=sc)
        return success_response(data=ShiftSerializer(shifts, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        serializer = ShiftSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        shift = _service.create_shift(security_context=sc, data=serializer.validated_data)
        return created_response(data=ShiftSerializer(shift).data, request=request)

class ShiftDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        try:
            shift = _service.get_shift(security_context=sc, shift_id=pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Shift not found.", http_status=404, request=request)
        return success_response(data=ShiftSerializer(shift).data, request=request)

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        try:
            shift = _service.get_shift(security_context=sc, shift_id=pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Shift not found.", http_status=404, request=request)
        serializer = ShiftSerializer(shift, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        updated = _service.update_shift(security_context=sc, shift_id=pk, data=serializer.validated_data)
        return success_response(data=ShiftSerializer(updated).data, request=request)

# yss_orbit\backend\apps\attendance\api\views\checkin_view.py
from __future__ import annotations
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.platform.core_response import success_response, created_response, error_response
from apps.attendance.api.serializers import CheckInSerializer, CheckOutSerializer, AttendanceRecordSerializer
from apps.hrms.services.attendance_service import AttendanceService
from .utils import _get_sc

_service = AttendanceService()

class CheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        d = serializer.validated_data
        try:
            record = _service.check_in(
                security_context=sc,
                employee_id=d["employee_id"],
                source=d.get("source", "MOBILE"),
                location=d.get("location"),
                device_id=d.get("device_id", ""),
            )
        except Exception as e:
            return error_response("CHECK_IN_FAILED", str(e), http_status=400, request=request)
        return created_response(data=AttendanceRecordSerializer(record).data, request=request)

class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        serializer = CheckOutSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        d = serializer.validated_data
        try:
            record = _service.check_out(
                security_context=sc,
                employee_id=d["employee_id"],
                location=d.get("location"),
                device_id=d.get("device_id", ""),
            )
        except ValueError as e:
            return error_response("CHECK_OUT_FAILED", str(e), http_status=400, request=request)
        return success_response(data=AttendanceRecordSerializer(record).data, request=request)

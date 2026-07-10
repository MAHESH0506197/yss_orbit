# yss_orbit\backend\apps\attendance\api\views\attendance_view.py
from __future__ import annotations
import uuid
from datetime import date
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.platform.core_response import success_response, error_response
from apps.attendance.api.serializers import AttendanceRecordSerializer, RegularizeSerializer, AttendanceLogSerializer
from apps.hrms.services.attendance_service import AttendanceService
from .utils import _get_sc

_service = AttendanceService()

class AttendanceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        emp_id = request.query_params.get("employee_id")
        from_date = request.query_params.get("from_date")
        to_date = request.query_params.get("to_date")
        att_status = request.query_params.get("status")

        records = _service.list_attendance(
            security_context=sc,
            employee_id=uuid.UUID(emp_id) if emp_id else None,
            from_date=date.fromisoformat(from_date) if from_date else None,
            to_date=date.fromisoformat(to_date) if to_date else None,
            status=att_status,
        )
        return success_response(data=AttendanceRecordSerializer(records, many=True).data, request=request)

class AttendanceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: uuid.UUID) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        try:
            record = _service.get_attendance(security_context=sc, employee_id=pk, date_=date.today()) # NOTE: Detail view typically expects record PK. But attendance_service has get_attendance which expects employee_id and date. We will fall back to querying the model.
            from apps.hrms.models import AttendanceRecord
            bu_id = sc.require_business_unit()
            record = AttendanceRecord.objects.select_related("shift").get(business_unit_id=bu_id, id=pk)
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Attendance record not found.", http_status=404, request=request)
        return success_response(data=AttendanceRecordSerializer(record).data, request=request)

class RegularizeAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        serializer = RegularizeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
        d = serializer.validated_data
        try:
            record = _service.regularize_attendance(
                security_context=sc, record_id=pk, new_status=d["status"],
                reason=d["reason"]
            )
        except ObjectDoesNotExist:
            return error_response("NOT_FOUND", "Attendance record not found.", http_status=404, request=request)
        return success_response(data=AttendanceRecordSerializer(record).data, message="Attendance regularized.", request=request)

class AttendanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        emp_id = request.query_params.get("employee_id")
        year = request.query_params.get("year")
        month = request.query_params.get("month")

        if not all([emp_id, year, month]):
            return error_response("MISSING_PARAMS", "employee_id, year, and month are required.", http_status=400, request=request)
        try:
            summary = _service.get_monthly_summary(
                security_context=sc, employee_id=uuid.UUID(emp_id),
                year=int(year), month=int(month),
            )
        except Exception as e:
            return error_response("SUMMARY_FAILED", str(e), http_status=400, request=request)
        return success_response(data=summary, request=request)

class AttendanceLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        sc, err = _get_sc(request)
        if err: return err
        emp_id = request.query_params.get("employee_id")
        date_str = request.query_params.get("date")
        if not emp_id:
            return error_response("MISSING_PARAMS", "employee_id is required.", http_status=400, request=request)
        logs = _service.list_logs(
            security_context=sc, employee_id=uuid.UUID(emp_id),
            date_=date.fromisoformat(date_str) if date_str else None,
        )
        return success_response(data=AttendanceLogSerializer(logs, many=True).data, request=request)
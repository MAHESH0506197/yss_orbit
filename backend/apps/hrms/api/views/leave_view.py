from __future__ import annotations

import uuid
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.platform.core_response import success_response, created_response, error_response
from apps.hrms.models import LeavePolicy, LeaveType, LeaveBalance, LeaveRequest
from apps.hrms.services.leave_service import LeaveService
from apps.hrms.api.serializers.leave_serializer import (
    LeavePolicySerializer, LeaveBalanceSerializer, LeaveRequestSerializer
)
from apps.hrms.api.views.utils import _require_bu



class LeaveBalanceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        employee_id = request.query_params.get("employee_id")
        year = request.query_params.get("year")
        
        if not employee_id or not year:
            return error_response("BAD_REQUEST", "employee_id and year are required.", http_status=400, request=request)
            
        balances = LeaveBalance.objects.filter(
            business_unit_id=bu_id,
            employee_id=employee_id,
            year=year
        ).select_related("leave_type")
        
        return success_response(data=LeaveBalanceSerializer(balances, many=True).data, request=request)


class LeaveRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        employee_id = request.query_params.get("employee_id")
        qs = LeaveRequest.objects.filter(business_unit_id=bu_id).select_related("leave_type").order_by("-created_at")
        
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
            
        return success_response(data=LeaveRequestSerializer(qs, many=True).data, request=request)

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        serializer = LeaveRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("VALIDATION_ERROR", "Invalid data.", details=serializer.errors, http_status=400, request=request)
            
        data = serializer.validated_data
        
        try:
            req = LeaveService.apply_leave(
                bu_id=bu_id,
                employee_id=request.data.get("employee"), # Since employee is read_only, it might be missing from validated_data
                leave_type_id=data["leave_type"].id,
                start_date=data["start_date"],
                end_date=data["end_date"],
                session=data.get("session", LeaveRequest.SessionChoices.FULL_DAY),
                reason=data.get("reason", "")
            )
            return created_response(data=LeaveRequestSerializer(req).data, request=request)
        except Exception as e:
            return error_response("LEAVE_ERROR", str(e), http_status=400, request=request)


class LeaveRequestApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        manager_id = request.data.get("manager_employee_id")
        comments = request.data.get("comments", "")
        
        try:
            req = LeaveService.approve_leave_manager(
                bu_id=bu_id,
                request_id=pk,
                manager_id=manager_id,
                comments=comments
            )
            return success_response(data=LeaveRequestSerializer(req).data, request=request)
        except Exception as e:
            return error_response("APPROVAL_ERROR", str(e), http_status=400, request=request)


class LeaveRequestHRApproveView(APIView):
    """
    POST /leave/requests/<pk>/hr-approve/
    HR second-step approval: MANAGER_APPROVED → APPROVED.
    Body: { hr_employee_id, comments? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        hr_id = request.data.get("hr_employee_id")
        if not hr_id:
            return error_response(
                "VALIDATION_ERROR", "hr_employee_id is required.", http_status=400, request=request
            )

        comments = request.data.get("comments", "")

        try:
            req = LeaveService.approve_leave_hr(
                bu_id=bu_id,
                request_id=pk,
                hr_id=uuid.UUID(str(hr_id)),
                comments=comments,
            )
            return success_response(data=LeaveRequestSerializer(req).data, request=request)
        except Exception as e:
            return error_response("APPROVAL_ERROR", str(e), http_status=400, request=request)


class LeaveRequestCancelView(APIView):
    """
    POST /leave/requests/<pk>/cancel/
    Employee self-cancellation (or HR override cancellation).
    Body: { cancelled_by_employee_id, reason? }
    For APPROVED leaves: balance is restored and attendance reverted.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        cancelled_by_id = request.data.get("cancelled_by_employee_id")
        if not cancelled_by_id:
            return error_response(
                "VALIDATION_ERROR", "cancelled_by_employee_id is required.", http_status=400, request=request
            )

        reason = request.data.get("reason", "")

        try:
            req = LeaveService.cancel_leave(
                bu_id=bu_id,
                request_id=pk,
                cancelled_by_id=uuid.UUID(str(cancelled_by_id)),
                reason=reason,
            )
            return success_response(data=LeaveRequestSerializer(req).data, request=request)
        except Exception as e:
            return error_response("CANCEL_ERROR", str(e), http_status=400, request=request)


class LeaveRequestRejectView(APIView):
    """
    POST /leave/requests/<pk>/reject/
    Manager or HR rejection.
    Body: { rejector_employee_id, comments? }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: uuid.UUID) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err

        rejector_id = request.data.get("rejector_employee_id")
        if not rejector_id:
            return error_response(
                "VALIDATION_ERROR", "rejector_employee_id is required.", http_status=400, request=request
            )

        comments = request.data.get("comments", "")

        try:
            req = LeaveService.reject_leave(
                bu_id=bu_id,
                request_id=pk,
                rejector_id=uuid.UUID(str(rejector_id)),
                comments=comments,
            )
            return success_response(data=LeaveRequestSerializer(req).data, request=request)
        except Exception as e:
            return error_response("REJECT_ERROR", str(e), http_status=400, request=request)


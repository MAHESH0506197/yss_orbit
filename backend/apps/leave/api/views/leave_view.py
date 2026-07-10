# yss_orbit\backend\apps\leave\api\views\leave_view.py
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from apps.hrms.services.leave_service import LeaveService
from apps.leave.api.serializers import (
    ApplyLeaveSerializer, LeaveTypeSerializer, LeaveBalanceSerializer, LeaveApplicationSerializer
)
from apps.hrms.models import LeaveType, LeaveBalance, LeaveRequest

class LeaveTypeListView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        types = LeaveType.objects.filter(business_unit_id=bu_id)
        return Response(LeaveTypeSerializer(types, many=True).data)

class LeaveTypeDetailView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        bu_id = request.security_context.require_business_unit()
        try:
            leave_type = LeaveType.objects.get(business_unit_id=bu_id, id=pk)
            return Response(LeaveTypeSerializer(leave_type).data)
        except LeaveType.DoesNotExist:
            return Response({"error": "LeaveType not found"}, status=status.HTTP_404_NOT_FOUND)

class LeaveBalanceView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        balances = LeaveBalance.objects.filter(
            business_unit_id=bu_id, employee_id=request.security_context.effective_user_id
        )
        return Response(LeaveBalanceSerializer(balances, many=True).data)

class LeaveRequestListView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        bu_id = request.security_context.require_business_unit()
        applications = LeaveRequest.objects.filter(
            business_unit_id=bu_id, employee_id=request.security_context.effective_user_id
        )
        return Response(LeaveApplicationSerializer(applications, many=True).data)

    def post(self, request):
        serializer = ApplyLeaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            application = LeaveService.apply_for_leave(
                security_context=request.security_context,
                employee_id=request.security_context.effective_user_id,
                leave_type_id=serializer.validated_data["leave_type_id"],
                start_date=serializer.validated_data["start_date"],
                end_date=serializer.validated_data["end_date"],
                reason=serializer.validated_data["reason"]
            )
            return Response(LeaveApplicationSerializer(application).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LeaveRequestDetailView(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        bu_id = request.security_context.require_business_unit()
        try:
            application = LeaveRequest.objects.get(business_unit_id=bu_id, id=pk)
            return Response(LeaveApplicationSerializer(application).data)
        except LeaveRequest.DoesNotExist:
            return Response({"error": "Leave request not found"}, status=status.HTTP_404_NOT_FOUND)

class LeaveApproveView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            application = LeaveService.approve_leave(
                security_context=request.security_context,
                application_id=pk
            )
            return Response(LeaveApplicationSerializer(application).data, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({"error": "Leave application not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class LeaveRejectView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        bu_id = request.security_context.require_business_unit()
        try:
            application = LeaveRequest.objects.get(business_unit_id=bu_id, id=pk)
            if application.employee_id == request.security_context.effective_user_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You cannot reject your own leave application.")
                
            application.status = LeaveRequest.Status.REJECTED
            application.approver_id = request.security_context.effective_user_id
            application.save()
            return Response(LeaveApplicationSerializer(application).data, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({"error": "Leave application not found"}, status=status.HTTP_404_NOT_FOUND)

class LeaveCancelView(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        bu_id = request.security_context.require_business_unit()
        try:
            application = LeaveRequest.objects.get(
                business_unit_id=bu_id, id=pk, employee_id=request.security_context.effective_user_id
            )
            application.delete()
            return Response({"status": "cancelled"}, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return Response({"error": "Leave application not found"}, status=status.HTTP_404_NOT_FOUND)

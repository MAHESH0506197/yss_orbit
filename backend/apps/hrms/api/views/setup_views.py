import uuid
from rest_framework import viewsets, mixins
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.platform.core_response import success_response, error_response
from apps.hrms.models import (
    LeaveType, LeavePolicy, LeaveRestrictionWindow, 
    HolidayCalendar, Holiday, LeaveBalance, Employee
)
from apps.hrms.api.serializers.leave_serializer import (
    LeaveTypeSerializer, LeavePolicySerializer
)
from apps.hrms.api.serializers.setup_serializer import (
    LeaveRestrictionWindowSerializer, HolidayCalendarSerializer, HolidaySerializer
)
from apps.hrms.api.views.utils import _get_bu_id, _require_bu
from rest_framework.exceptions import ValidationError


class BaseSetupViewSet(viewsets.ModelViewSet):
    """Base ViewSet that automatically scopes queries to the business unit."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        bu_id = _get_bu_id(self.request)
        if not bu_id:
            return self.queryset.none()
        return self.queryset.filter(business_unit_id=bu_id, is_active=True)

    def perform_create(self, serializer):
        bu_id = _get_bu_id(self.request)
        if not bu_id:
            raise ValidationError({"business_unit_id": "X-Business-Unit-ID header is required."})
        serializer.save(business_unit_id=bu_id)


class LeaveTypeViewSet(BaseSetupViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer


class LeavePolicyViewSet(BaseSetupViewSet):
    queryset = LeavePolicy.objects.all()
    serializer_class = LeavePolicySerializer


class LeaveRestrictionWindowViewSet(BaseSetupViewSet):
    queryset = LeaveRestrictionWindow.objects.all()
    serializer_class = LeaveRestrictionWindowSerializer


class HolidayCalendarViewSet(BaseSetupViewSet):
    queryset = HolidayCalendar.objects.all()
    serializer_class = HolidayCalendarSerializer


class HolidayViewSet(BaseSetupViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        calendar_id = self.kwargs.get("calendar_id")
        if calendar_id:
            qs = qs.filter(calendar_id=calendar_id)
        return qs

    def perform_create(self, serializer):
        bu_id = _get_bu_id(self.request)
        if not bu_id:
            raise ValidationError({"business_unit_id": "X-Business-Unit-ID header is required."})
        
        calendar_id = self.kwargs.get("calendar_id")
        if calendar_id:
            serializer.save(business_unit_id=bu_id, calendar_id=calendar_id)
        else:
            serializer.save(business_unit_id=bu_id)


class LeaveAllocationView(APIView):
    """
    POST /hrms/leave/allocations/
    Bulk allocate leave balances for a specific year and leave type.
    Body:
    {
        "year": 2026,
        "leave_type_id": "uuid",
        "allocations": [
            {"employee_id": "uuid", "opening_balance": 12.0},
            {"employee_id": "uuid", "opening_balance": 12.0}
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        bu_id, err = _require_bu(request)
        if err:
            return err
            
        year = request.data.get("year")
        leave_type_id = request.data.get("leave_type_id")
        allocations = request.data.get("allocations", [])
        
        if not year or not leave_type_id or not allocations:
            return error_response(
                "VALIDATION_ERROR", "year, leave_type_id, and allocations are required.", 
                http_status=400, request=request
            )
            
        # Ensure leave type belongs to BU
        if not LeaveType.objects.filter(id=leave_type_id, business_unit_id=bu_id).exists():
            return error_response("NOT_FOUND", "LeaveType not found.", http_status=404, request=request)
            
        employee_ids = [str(a["employee_id"]) for a in allocations]
        employees_in_bu = set(Employee.objects.filter(
            id__in=employee_ids, business_unit_id=bu_id
        ).values_list("id", flat=True))
        
        created_count = 0
        updated_count = 0
        
        for alloc in allocations:
            emp_id = str(alloc["employee_id"])
            if uuid.UUID(emp_id) not in employees_in_bu:
                continue
                
            balance, created = LeaveBalance.objects.update_or_create(
                business_unit_id=bu_id,
                employee_id=emp_id,
                leave_type_id=leave_type_id,
                year=year,
                defaults={"opening_balance": alloc["opening_balance"]}
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return success_response(
            data={"created": created_count, "updated": updated_count}, 
            message="Leave allocations processed successfully.",
            request=request
        )

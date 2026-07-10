from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.hrms.models import AttendanceCorrectionRequest, AttendanceRecord, Employee
from apps.hrms.api.serializers.attendance_correction_serializer import AttendanceCorrectionRequestSerializer
from apps.platform.core_exceptions import ValidationException
from apps.hrms.services.attendance_service import AttendanceService

def _require_bu(request):
    bu_id = request.headers.get('X-Business-Unit-Id')
    if not bu_id:
        raise ValidationException("X-Business-Unit-Id header is required")
    return bu_id

class AttendanceCorrectionRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceCorrectionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        bu_id = _require_bu(self.request)
        qs = AttendanceCorrectionRequest.objects.filter(business_unit_id=bu_id).select_related(
            'employee', 'record'
        )
        
        # Filtering
        emp_id = self.request.query_params.get('employee_id')
        status_filter = self.request.query_params.get('status')
        
        # Regular employees can only see their own requests
        # If no admin permission is configured yet, we will just filter by employee_id if provided
        # But for actual production, we check permissions.
        try:
            employee = Employee.objects.get(user_id=self.request.user.id, business_unit_id=bu_id)
            # If not HR/Admin, restrict to their own
            if not self.request.user.is_super_admin: # A simplistic check
                qs = qs.filter(employee=employee)
        except Employee.DoesNotExist:
            pass

        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        bu_id = _require_bu(self.request)
        try:
            employee = Employee.objects.get(user_id=self.request.user.id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            raise ValidationException("Employee profile not found.")
            
        # Ensure the record belongs to the employee
        record = serializer.validated_data.get('record')
        if record.employee_id != employee.id:
            raise ValidationException("Cannot request correction for another employee's record.")
            
        serializer.save(business_unit_id=bu_id, employee=employee)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        bu_id = _require_bu(request)
        correction = self.get_object()
        
        if correction.status != AttendanceCorrectionRequest.Status.PENDING:
            return Response({"error": "Only pending requests can be approved."}, status=status.HTTP_400_BAD_REQUEST)
            
        record = correction.record
        
        if record.is_locked:
            return Response({"error": "Cannot approve correction for a locked payroll period."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Apply the correction to the record
        if correction.requested_in_time:
            record.actual_in = correction.requested_in_time
        if correction.requested_out_time:
            record.actual_out = correction.requested_out_time
            
        record.save()
        
        # Recalculate status using AttendanceService
        AttendanceService._recalculate_record(record)
        
        correction.status = AttendanceCorrectionRequest.Status.APPROVED
        correction.approved_by_user_id = request.user.id
        correction.approved_at = timezone.now()
        correction.save()
        
        return Response(self.get_serializer(correction).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        bu_id = _require_bu(request)
        correction = self.get_object()
        
        if correction.status != AttendanceCorrectionRequest.Status.PENDING:
            return Response({"error": "Only pending requests can be rejected."}, status=status.HTTP_400_BAD_REQUEST)
            
        correction.status = AttendanceCorrectionRequest.Status.REJECTED
        correction.save()
        
        return Response(self.get_serializer(correction).data)

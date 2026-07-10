import datetime
import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models

from apps.hrms.models import AttendanceRecord, Employee
from apps.hrms.api.serializers.attendance_serializer import AttendanceRecordSerializer
from apps.hrms.services.attendance_service import AttendanceService
from apps.platform.core_exceptions import ValidationException

def _require_bu(request) -> uuid.UUID:
    """Extract and validate X-Business-Unit-Id header. Returns UUID — never raw string."""
    bu_str = request.headers.get('X-Business-Unit-Id')
    if not bu_str:
        raise ValidationException("X-Business-Unit-Id header is required")
    try:
        return uuid.UUID(str(bu_str))
    except (ValueError, TypeError):
        raise ValidationException("Invalid X-Business-Unit-Id header — must be a valid UUID")

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        bu_id = _require_bu(self.request)
        qs = AttendanceRecord.objects.filter(business_unit_id=bu_id).select_related(
            'employee__department', 'shift'
        ).prefetch_related('punches', 'correction_requests', 'correction_requests__employee', 'correction_requests__approved_by')
        
        # Security Audit: Row-level visibility
        security_ctx = getattr(self.request, 'security_context', None)
        if security_ctx:
            if not security_ctx.has_permission('hrms.attendance.manage'):
                # Not an admin, so restrict visibility
                effective_uid = security_ctx.effective_user_id
                
                # Check if user is a manager
                manager_employee = Employee.objects.filter(user_id=effective_uid, business_unit_id=bu_id).first()
                if manager_employee:
                    # Can see their own records OR records of their reports
                    qs = qs.filter(
                        models.Q(employee=manager_employee) | 
                        models.Q(employee__reporting_manager_id=manager_employee.id)
                    )
                else:
                    # Pure fallback to self (if employee missing entirely, though rare)
                    qs = qs.filter(employee__user_id=effective_uid)
        
        # Filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        emp_id = self.request.query_params.get('employee_id')
        shift_id = self.request.query_params.get('shift_id')
        status_filter = self.request.query_params.get('status')
        dept_id = self.request.query_params.get('department_id')
        desig_id = self.request.query_params.get('designation_id')
        late_only = self.request.query_params.get('late_only')
        missed_punch_only = self.request.query_params.get('missed_punch_only')
        
        if date_from and date_to:
            qs = qs.filter(attendance_date__range=[date_from, date_to])
        elif date_from:
            qs = qs.filter(attendance_date__gte=date_from)
        elif date_to:
            qs = qs.filter(attendance_date__lte=date_to)
        else:
            # default to today
            today = timezone.now().date()
            qs = qs.filter(attendance_date=today)
            
        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        if shift_id:
            qs = qs.filter(shift_id=shift_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if dept_id:
            qs = qs.filter(employee__department_id=dept_id)
        if desig_id:
            qs = qs.filter(employee__designation_id=desig_id)
        if late_only and late_only.lower() in ['true', '1', 'yes']:
            qs = qs.filter(late_minutes__gt=0)
        if missed_punch_only and missed_punch_only.lower() in ['true', '1', 'yes']:
            qs = qs.filter(status='MISSED_PUNCH')
            
        return qs.order_by('-attendance_date', 'employee__employee_code')

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.filter_queryset(self.get_queryset())
        
        total = qs.count()
        present = qs.filter(status__in=['PRESENT', 'HALF_DAY', 'WORK_FROM_HOME', 'ON_DUTY']).count()
        absent = qs.filter(status='ABSENT').count()
        late = qs.filter(status='LATE').count()
        on_leave = qs.filter(status__in=['ON_LEAVE', 'PAID_LEAVE', 'UNPAID_LEAVE', 'HALF_DAY_LEAVE']).count()
        missed_punch = qs.filter(status='MISSED_PUNCH').count()
        
        # Pending corrections
        from apps.hrms.models import AttendanceCorrectionRequest
        bu_id = _require_bu(request)
        corr_qs = AttendanceCorrectionRequest.objects.filter(
            business_unit_id=bu_id, 
            status=AttendanceCorrectionRequest.Status.PENDING
        )
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from and date_to:
            corr_qs = corr_qs.filter(record__attendance_date__range=[date_from, date_to])
        elif date_from:
            corr_qs = corr_qs.filter(record__attendance_date__gte=date_from)
        elif date_to:
            corr_qs = corr_qs.filter(record__attendance_date__lte=date_to)
            
        emp_id = self.request.query_params.get('employee_id')
        if emp_id:
            corr_qs = corr_qs.filter(employee_id=emp_id)
            
        pending_corrections = corr_qs.count()

        return Response({
            "total": total,
            "present": present,
            "present_percentage": round((present / total * 100), 1) if total > 0 else 0.0,
            "absent": absent,
            "absent_percentage": round((absent / total * 100), 1) if total > 0 else 0.0,
            "late": late,
            "on_leave": on_leave,
            "missed_punch": missed_punch,
            "pending_corrections": pending_corrections
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        qs = self.filter_queryset(self.get_queryset())
        
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendance_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Employee Code', 'Employee Name', 'Department', 'Date', 'Shift', 'In Time', 'Out Time', 'Work Hours', 'Status', 'Late Minutes'])
        
        for record in qs:
            writer.writerow([
                record.employee.employee_code,
                record.employee.full_name,
                record.employee.department.name if record.employee.department else '-',
                record.attendance_date,
                record.shift.name if record.shift else 'General',
                record.actual_in.strftime('%H:%M:%S') if record.actual_in else '-',
                record.actual_out.strftime('%H:%M:%S') if record.actual_out else '-',
                record.work_hours,
                record.status,
                record.late_minutes
            ])
            
        return response

    @action(detail=False, methods=['post'])
    def punch(self, request):
        bu_id = _require_bu(request)
        
        try:
            employee = Employee.objects.get(user_id=request.user.id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found for the current user."}, status=status.HTTP_404_NOT_FOUND)
            
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')
        source = request.data.get('source', 'WEB')
        
        try:
            punch = AttendanceService.record_punch(
                employee=employee,
                source=source,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Return updated record
            record = punch.record
            serializer = self.get_serializer(record)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='admin-punch')
    def admin_punch(self, request):
        bu_id = _require_bu(request)
        
        # Verify if request user has admin permissions
        security_ctx = getattr(request, 'security_context', None)
        if security_ctx:
            security_ctx.require_permission('hrms.attendance.manage')
        
        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({"error": "employee_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            employee = Employee.objects.get(id=employee_id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            return Response({"error": "Employee not found in this business unit."}, status=status.HTTP_404_NOT_FOUND)
            
        punch_time_str = request.data.get('punch_time')
        punch_time = None
        if punch_time_str:
            try:
                # Ensure it's a valid datetime
                from dateutil.parser import parse
                punch_time = parse(punch_time_str)
                # If naive, make aware
                if timezone.is_naive(punch_time):
                    punch_time = timezone.make_aware(punch_time)
            except Exception:
                return Response({"error": "Invalid punch_time format."}, status=status.HTTP_400_BAD_REQUEST)

        source = request.data.get('source', AttendancePunch.Source.MANUAL)
        
        try:
            punch = AttendanceService.record_punch(
                employee=employee,
                source=source,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT'),
                punch_time=punch_time
            )
            
            record = punch.record
            serializer = self.get_serializer(record)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        bu_id = _require_bu(request)  # now returns UUID
        try:
            employee = Employee.objects.get(user_id=request.user.id, business_unit_id=bu_id)
        except Employee.DoesNotExist:
            return Response({"error": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get today's record — MUST include business_unit_id to prevent cross-tenant leak
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(
            business_unit_id=bu_id,   # ← tenant isolation guard
            employee=employee,
            attendance_date=today
        ).first()

        if record:
            serializer = self.get_serializer(record)
            return Response(serializer.data)
        return Response({})  # No punches today yet

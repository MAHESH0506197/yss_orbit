# yss_orbit\backend\implement_hr_expert.py
import os

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

APPS_TO_IMPLEMENT = {
    "attendance": {
        "models": {
            "attendance_model.py": """
from django.db import models
from apps.platform.models.base import TenantModel

class AttendanceLog(TenantModel):
    employee_id = models.UUIDField()
    punch_time = models.DateTimeField()
    punch_type = models.CharField(max_length=20, choices=[('IN', 'In'), ('OUT', 'Out')])
    device_id = models.CharField(max_length=100, blank=True)
    biometric_data = models.TextField(blank=True, null=True)
    
class DailyAttendance(TenantModel):
    employee_id = models.UUIDField()
    date = models.DateField()
    first_punch_in = models.DateTimeField(null=True)
    last_punch_out = models.DateTimeField(null=True)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=[('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('HALFDAY', 'Half Day')])
    is_regularized = models.BooleanField(default=False)
"""
        },
        "api/serializers": {
            "attendance_serializer.py": """
from rest_framework import serializers
from apps.attendance.models.attendance_model import AttendanceLog, DailyAttendance

class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = '__all__'

class DailyAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAttendance
        fields = '__all__'
"""
        },
        "api/views": {
            "attendance_view.py": """
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.attendance.models.attendance_model import AttendanceLog, DailyAttendance
from apps.attendance.api.serializers.attendance_serializer import AttendanceLogSerializer, DailyAttendanceSerializer
from apps.attendance.services.attendance_service import AttendanceAggregationService

class AttendanceLogViewSet(viewsets.ModelViewSet):
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    
    @action(detail=False, methods=['post'])
    def aggregate(self, request):
        date = request.data.get('date')
        AttendanceAggregationService.aggregate_daily_attendance(date)
        return Response({'status': 'aggregated'}, status=status.HTTP_200_OK)

class DailyAttendanceViewSet(viewsets.ModelViewSet):
    queryset = DailyAttendance.objects.all()
    serializer_class = DailyAttendanceSerializer
"""
        },
        "services": {
            "attendance_service.py": """
from datetime import datetime, date, timedelta
from django.db.models import Min, Max
from apps.attendance.models.attendance_model import AttendanceLog, DailyAttendance

class AttendanceAggregationService:
    @staticmethod
    def aggregate_daily_attendance(target_date: date):
        logs = AttendanceLog.objects.filter(punch_time__date=target_date)
        employee_ids = logs.values_list('employee_id', flat=True).distinct()
        
        for emp_id in employee_ids:
            emp_logs = logs.filter(employee_id=emp_id).order_by('punch_time')
            first_in = emp_logs.filter(punch_type='IN').first()
            last_out = emp_logs.filter(punch_type='OUT').last()
            
            total_hours = 0.0
            if first_in and last_out:
                delta = last_out.punch_time - first_in.punch_time
                total_hours = delta.total_seconds() / 3600.0
            
            status = 'PRESENT' if total_hours >= 8 else 'HALFDAY' if total_hours >= 4 else 'ABSENT'
            
            DailyAttendance.objects.update_or_create(
                employee_id=emp_id,
                date=target_date,
                defaults={
                    'first_punch_in': first_in.punch_time if first_in else None,
                    'last_punch_out': last_out.punch_time if last_out else None,
                    'total_hours': total_hours,
                    'status': status
                }
            )
"""
        }
    },
    "leave_management": {
        "models": {
            "leave_model.py": """
from django.db import models
from apps.platform.models.base import TenantModel

class LeaveType(TenantModel):
    name = models.CharField(max_length=100)
    days_allowed = models.IntegerField()
    is_carry_forward = models.BooleanField(default=False)

class LeaveBalance(TenantModel):
    employee_id = models.UUIDField()
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

class LeaveApplication(TenantModel):
    employee_id = models.UUIDField()
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING')
    approver_id = models.UUIDField(null=True, blank=True)
"""
        },
        "api/serializers": {
            "leave_serializer.py": """
from rest_framework import serializers
from apps.leave_management.models.leave_model import LeaveType, LeaveBalance, LeaveApplication

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta: model = LeaveType; fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta: model = LeaveBalance; fields = '__all__'

class LeaveApplicationSerializer(serializers.ModelSerializer):
    class Meta: model = LeaveApplication; fields = '__all__'
"""
        },
        "api/views": {
            "leave_view.py": """
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.leave_management.models.leave_model import LeaveType, LeaveBalance, LeaveApplication
from apps.leave_management.api.serializers.leave_serializer import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveApplicationSerializer
from apps.leave_management.services.leave_approval_service import LeaveApprovalService

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer

class LeaveApplicationViewSet(viewsets.ModelViewSet):
    queryset = LeaveApplication.objects.all()
    serializer_class = LeaveApplicationSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        application = self.get_object()
        approver_id = request.data.get('approver_id')
        LeaveApprovalService.process_approval(application, approver_id, 'APPROVED')
        return Response({'status': 'approved'})
        
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        approver_id = request.data.get('approver_id')
        LeaveApprovalService.process_approval(application, approver_id, 'REJECTED')
        return Response({'status': 'rejected'})
"""
        },
        "services": {
            "leave_approval_service.py": """
from apps.leave_management.models.leave_model import LeaveApplication, LeaveBalance
from django.db import transaction

class LeaveApprovalService:
    @staticmethod
    @transaction.atomic
    def process_approval(application: LeaveApplication, approver_id: str, new_status: str):
        # Hierarchical leave approval logic
        # Here we just verify balance and update status for MVP
        if new_status == 'APPROVED':
            days = (application.end_date - application.start_date).days + 1
            balance = LeaveBalance.objects.select_for_update().get(
                employee_id=application.employee_id,
                leave_type=application.leave_type
            )
            if balance.balance >= days:
                balance.balance -= days
                balance.save()
            else:
                raise ValueError("Insufficient leave balance")
                
        application.status = new_status
        application.approver_id = approver_id
        application.save()
"""
        }
    },
    "payroll": {
        "models": {
            "payroll_model.py": """
from django.db import models
from apps.platform.models.base import TenantModel

class SalaryComponent(TenantModel):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=[('EARNING', 'Earning'), ('DEDUCTION', 'Deduction')])
    amount = models.DecimalField(max_digits=10, decimal_places=2)

class PayrollRun(TenantModel):
    month = models.IntegerField()
    year = models.IntegerField()
    status = models.CharField(max_length=20, choices=[('DRAFT', 'Draft'), ('PROCESSED', 'Processed')], default='DRAFT')
    ledger_generated = models.BooleanField(default=False)

class Payslip(TenantModel):
    employee_id = models.UUIDField()
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE)
    basic_pay = models.DecimalField(max_digits=10, decimal_places=2)
    net_pay = models.DecimalField(max_digits=10, decimal_places=2)
    
class PayrollLedger(TenantModel):
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE)
    account_code = models.CharField(max_length=50)
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0.0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0.0)
"""
        },
        "api/serializers": {
            "payroll_serializer.py": """
from rest_framework import serializers
from apps.payroll.models.payroll_model import PayrollRun, Payslip, SalaryComponent, PayrollLedger

class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta: model = PayrollRun; fields = '__all__'

class PayslipSerializer(serializers.ModelSerializer):
    class Meta: model = Payslip; fields = '__all__'
    
class PayrollLedgerSerializer(serializers.ModelSerializer):
    class Meta: model = PayrollLedger; fields = '__all__'
"""
        },
        "api/views": {
            "payroll_view.py": """
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.payroll.models.payroll_model import PayrollRun, Payslip, PayrollLedger
from apps.payroll.api.serializers.payroll_serializer import PayrollRunSerializer, PayslipSerializer, PayrollLedgerSerializer
from apps.payroll.services.payroll_service import AutomatedPayrollService

class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.all()
    serializer_class = PayrollRunSerializer
    
    @action(detail=True, methods=['post'])
    def process_run(self, request, pk=None):
        run = self.get_object()
        AutomatedPayrollService.generate_ledger_for_run(run)
        return Response({'status': 'ledger generated'})

class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer

class PayrollLedgerViewSet(viewsets.ModelViewSet):
    queryset = PayrollLedger.objects.all()
    serializer_class = PayrollLedgerSerializer
"""
        },
        "services": {
            "payroll_service.py": """
from apps.payroll.models.payroll_model import PayrollRun, Payslip, PayrollLedger
from django.db import transaction
from django.db.models import Sum

class AutomatedPayrollService:
    @staticmethod
    @transaction.atomic
    def generate_ledger_for_run(run: PayrollRun):
        if run.ledger_generated:
            raise ValueError("Ledger already generated for this run")
            
        payslips = Payslip.objects.filter(payroll_run=run)
        total_net_pay = payslips.aggregate(Sum('net_pay'))['net_pay__sum'] or 0.0
        total_basic = payslips.aggregate(Sum('basic_pay'))['basic_pay__sum'] or 0.0
        
        # Simple ledger entries
        PayrollLedger.objects.create(
            payroll_run=run,
            account_code='SALARY_EXPENSE_ACC',
            debit=total_basic,
            credit=0.0
        )
        PayrollLedger.objects.create(
            payroll_run=run,
            account_code='BANK_PAYABLE_ACC',
            debit=0.0,
            credit=total_net_pay
        )
        run.ledger_generated = True
        run.status = 'PROCESSED'
        run.save()
"""
        }
    },
    "hrms": {
        "models": {
            "employee_model.py": """
from django.db import models
from apps.platform.models.base import TenantModel

class Employee(TenantModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    status = models.CharField(max_length=20, choices=[('ONBOARDING', 'Onboarding'), ('ACTIVE', 'Active'), ('OFFBOARDING', 'Offboarding'), ('TERMINATED', 'Terminated')])
    join_date = models.DateField()
    department_id = models.UUIDField(null=True, blank=True)
    manager_id = models.UUIDField(null=True, blank=True)
"""
        },
        "api/serializers": {
            "employee_serializer.py": """
from rest_framework import serializers
from apps.hrms.models.employee_model import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta: model = Employee; fields = '__all__'
"""
        },
        "api/views": {
            "employee_view.py": """
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.hrms.models.employee_model import Employee
from apps.hrms.api.serializers.employee_serializer import EmployeeSerializer
from apps.hrms.services.lifecycle_service import EmployeeLifecycleService

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    
    @action(detail=True, methods=['post'])
    def onboard(self, request, pk=None):
        emp = self.get_object()
        EmployeeLifecycleService.onboard_employee(emp)
        return Response({'status': 'onboarded'})
        
    @action(detail=True, methods=['post'])
    def offboard(self, request, pk=None):
        emp = self.get_object()
        EmployeeLifecycleService.offboard_employee(emp)
        return Response({'status': 'offboarded'})
"""
        },
        "services": {
            "lifecycle_service.py": """
from apps.hrms.models.employee_model import Employee

class EmployeeLifecycleService:
    @staticmethod
    def onboard_employee(employee: Employee):
        employee.status = 'ACTIVE'
        employee.save()
        # Additional onboarding logic like sending emails, creating accounts, etc.
        
    @staticmethod
    def offboard_employee(employee: Employee):
        employee.status = 'OFFBOARDING'
        employee.save()
        # Offboarding logic like revoking access
"""
        }
    }
}

for app_name, modules in APPS_TO_IMPLEMENT.items():
    app_dir = os.path.join(base_dir, app_name)
    os.makedirs(app_dir, exist_ok=True)
    
    for module_path, files in modules.items():
        module_dir = os.path.join(app_dir, module_path.replace("/", os.sep))
        os.makedirs(module_dir, exist_ok=True)
        
        # create __init__.py files
        init_file = os.path.join(module_dir, "__init__.py")
        if not os.path.exists(init_file):
            open(init_file, "w").close()
            
        for file_name, content in files.items():
            file_path = os.path.join(module_dir, file_name)
            with open(file_path, "w") as f:
                f.write(content.strip() + "\\n")
            print(f"Wrote {file_path}")

print("Done generating HR apps logic!")

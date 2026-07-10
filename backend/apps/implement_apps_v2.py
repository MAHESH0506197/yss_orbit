# yss_orbit\backend\apps\implement_apps_v2.py
import os

base = r"c:\PROJECT\yss_orbit\backend\apps"

# 1. Clean up empty files in hrms_core and appraisal (just to be clean, or I can just ignore them and write to the root of the app)
# Wait, I'll just write to the standard structure in the app's root.

# --- HRMS_CORE ---
hrms_core_dir = os.path.join(base, "hrms_core")
os.makedirs(hrms_core_dir, exist_ok=True)

with open(os.path.join(hrms_core_dir, "models.py"), "w") as f:
    f.write("""from django.db import models
from apps.platform.models.base import TenantModel

class CompanyPolicy(TenantModel):
    title = models.CharField(max_length=255)
    content = models.TextField()
    effective_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Holiday(TenantModel):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.date}"
""")

with open(os.path.join(hrms_core_dir, "serializers.py"), "w") as f:
    f.write("""from rest_framework import serializers
from .models import CompanyPolicy, Holiday

class CompanyPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyPolicy
        fields = '__all__'

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'
""")

with open(os.path.join(hrms_core_dir, "views.py"), "w") as f:
    f.write("""from rest_framework import viewsets
from .models import CompanyPolicy, Holiday
from .serializers import CompanyPolicySerializer, HolidaySerializer

class CompanyPolicyViewSet(viewsets.ModelViewSet):
    queryset = CompanyPolicy.objects.all()
    serializer_class = CompanyPolicySerializer

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
""")

with open(os.path.join(hrms_core_dir, "urls.py"), "w") as f:
    f.write("""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyPolicyViewSet, HolidayViewSet

router = DefaultRouter()
router.register(r'policies', CompanyPolicyViewSet, basename='policy')
router.register(r'holidays', HolidayViewSet, basename='holiday')

urlpatterns = [
    path('', include(router.urls)),
]
""")

with open(os.path.join(hrms_core_dir, "services.py"), "w") as f:
    f.write("""from .models import CompanyPolicy

class HrmsCoreService:
    @staticmethod
    def get_active_policies(business_unit_id):
        return CompanyPolicy.objects.filter(business_unit_id=business_unit_id, is_active=True)
""")

# --- APPRAISAL ---
appraisal_dir = os.path.join(base, "appraisal")
os.makedirs(appraisal_dir, exist_ok=True)

with open(os.path.join(appraisal_dir, "models.py"), "w") as f:
    f.write("""from django.db import models
from django.conf import settings
from apps.platform.models.base import TenantModel
from apps.hrms.models.employee import Employee

class AppraisalCycle(TenantModel):
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class KPI(TenantModel):
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='kpis')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

    def __str__(self):
        return self.title

class EmployeeAppraisal(TenantModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('REVIEWED', 'Reviewed'),
        ('CLOSED', 'Closed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='appraisals')
    cycle = models.ForeignKey(AppraisalCycle, on_delete=models.CASCADE, related_name='employee_appraisals')
    manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='managed_appraisals')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    self_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    manager_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee} - {self.cycle.name}"
""")

with open(os.path.join(appraisal_dir, "serializers.py"), "w") as f:
    f.write("""from rest_framework import serializers
from .models import AppraisalCycle, KPI, EmployeeAppraisal

class AppraisalCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppraisalCycle
        fields = '__all__'

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'

class EmployeeAppraisalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAppraisal
        fields = '__all__'
""")

with open(os.path.join(appraisal_dir, "views.py"), "w") as f:
    f.write("""from rest_framework import viewsets
from .models import AppraisalCycle, KPI, EmployeeAppraisal
from .serializers import AppraisalCycleSerializer, KPISerializer, EmployeeAppraisalSerializer

class AppraisalCycleViewSet(viewsets.ModelViewSet):
    queryset = AppraisalCycle.objects.all()
    serializer_class = AppraisalCycleSerializer

class KPIViewSet(viewsets.ModelViewSet):
    queryset = KPI.objects.all()
    serializer_class = KPISerializer

class EmployeeAppraisalViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAppraisal.objects.all()
    serializer_class = EmployeeAppraisalSerializer
""")

with open(os.path.join(appraisal_dir, "urls.py"), "w") as f:
    f.write("""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppraisalCycleViewSet, KPIViewSet, EmployeeAppraisalViewSet

router = DefaultRouter()
router.register(r'cycles', AppraisalCycleViewSet, basename='appraisal-cycle')
router.register(r'kpis', KPIViewSet, basename='kpi')
router.register(r'employee-appraisals', EmployeeAppraisalViewSet, basename='employee-appraisal')

urlpatterns = [
    path('', include(router.urls)),
]
""")

with open(os.path.join(appraisal_dir, "services.py"), "w") as f:
    f.write("""from .models import EmployeeAppraisal, AppraisalCycle

class AppraisalService:
    @staticmethod
    def initiate_appraisals_for_cycle(cycle_id, employees):
        cycle = AppraisalCycle.objects.get(id=cycle_id)
        appraisals = []
        for emp in employees:
            appraisal, created = EmployeeAppraisal.objects.get_or_create(
                business_unit_id=cycle.business_unit_id,
                employee=emp,
                cycle=cycle,
                defaults={'manager': emp.reporting_manager} # assuming reporting_manager exists
            )
            appraisals.append(appraisal)
        return appraisals
""")

# --- PAYROLL ---
# I will also generate standard files in payroll just in case it is missing serializers and urls in standard layout.
payroll_dir = os.path.join(base, "payroll")
os.makedirs(payroll_dir, exist_ok=True)

with open(os.path.join(payroll_dir, "serializers.py"), "w") as f:
    f.write("""from rest_framework import serializers
from .models import SalaryStructure, Payslip

class SalaryStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryStructure
        fields = '__all__'

class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = '__all__'
""")

with open(os.path.join(payroll_dir, "views.py"), "w") as f:
    f.write("""from rest_framework import viewsets
from .models import SalaryStructure, Payslip
from .serializers import SalaryStructureSerializer, PayslipSerializer

class SalaryStructureViewSet(viewsets.ModelViewSet):
    queryset = SalaryStructure.objects.all()
    serializer_class = SalaryStructureSerializer

class PayslipViewSet(viewsets.ModelViewSet):
    queryset = Payslip.objects.all()
    serializer_class = PayslipSerializer
""")

with open(os.path.join(payroll_dir, "urls.py"), "w") as f:
    f.write("""from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryStructureViewSet, PayslipViewSet

router = DefaultRouter()
router.register(r'salary-structures', SalaryStructureViewSet, basename='salary-structure')
router.register(r'payslips', PayslipViewSet, basename='payslip')

urlpatterns = [
    path('', include(router.urls)),
]
""")

with open(os.path.join(payroll_dir, "services.py"), "w") as f:
    f.write("""from .models import Payslip, SalaryStructure
from datetime import date

class PayrollService:
    @staticmethod
    def generate_payslip(employee, period_start, period_end):
        structure = SalaryStructure.objects.filter(employee=employee, is_active=True).first()
        if not structure:
            raise ValueError("No active salary structure found")
        
        net_pay = structure.basic_salary + structure.hra + structure.allowances - structure.deductions
        payslip = Payslip.objects.create(
            business_unit_id=employee.business_unit_id,
            employee=employee,
            period_start=period_start,
            period_end=period_end,
            basic=structure.basic_salary,
            hra=structure.hra,
            allowances=structure.allowances,
            deductions=structure.deductions,
            net_pay=net_pay,
            status='DRAFT'
        )
        return payslip
""")

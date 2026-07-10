# yss_orbit\backend\apps\create_models.py
import os

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

# 1. hrms_core models
hrms_core_models_dir = os.path.join(base_dir, "hrms_core", "models")
os.makedirs(hrms_core_models_dir, exist_ok=True)

init_content = """from .department_model import Department
from .designation_model import Designation
from .employee_model import Employee
"""

department_content = """from django.db import models
from apps.platform.models.base import TenantModel

class Department(TenantModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
"""

designation_content = """from django.db import models
from apps.platform.models.base import TenantModel

class Designation(TenantModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    level = models.IntegerField(default=1)
    
    def __str__(self):
        return self.title
"""

employee_content = """from django.db import models
from django.conf import settings
from apps.platform.models.base import TenantModel
from .department_model import Department
from .designation_model import Designation

class Employee(TenantModel):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ON_LEAVE', 'On Leave'),
        ('TERMINATED', 'Terminated'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_profiles')
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    joining_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"
"""

with open(os.path.join(hrms_core_models_dir, "__init__.py"), "w") as f: f.write(init_content)
with open(os.path.join(hrms_core_models_dir, "department_model.py"), "w") as f: f.write(department_content)
with open(os.path.join(hrms_core_models_dir, "designation_model.py"), "w") as f: f.write(designation_content)
with open(os.path.join(hrms_core_models_dir, "employee_model.py"), "w") as f: f.write(employee_content)

# 2. payroll models
payroll_models_dir = os.path.join(base_dir, "payroll", "models")
os.makedirs(payroll_models_dir, exist_ok=True)

payroll_init_content = """from .salary_structure import SalaryStructure
from .payslip import Payslip
"""

salary_structure_content = """from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms_core.models import Employee

class SalaryStructure(TenantModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='salary_structures')
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    effective_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Salary Structure for {self.employee.employee_id}"
"""

payslip_content = """from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms_core.models import Employee

class Payslip(TenantModel):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('GENERATED', 'Generated'),
        ('PAID', 'Paid'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payslips')
    period_start = models.DateField()
    period_end = models.DateField()
    basic = models.DecimalField(max_digits=12, decimal_places=2)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    payment_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Payslip {self.id} for {self.employee.employee_id}"
"""
with open(os.path.join(payroll_models_dir, "__init__.py"), "w") as f: f.write(payroll_init_content)
with open(os.path.join(payroll_models_dir, "salary_structure.py"), "w") as f: f.write(salary_structure_content)
with open(os.path.join(payroll_models_dir, "payslip.py"), "w") as f: f.write(payslip_content)

# 3. appraisal models
appraisal_models_dir = os.path.join(base_dir, "appraisal", "models")
os.makedirs(appraisal_models_dir, exist_ok=True)

appraisal_init_content = """from .performance_review import PerformanceReview
from .goal import Goal
"""

performance_review_content = """from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms_core.models import Employee

class PerformanceReview(TenantModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='reviews_given')
    period_start = models.DateField()
    period_end = models.DateField()
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"Review for {self.employee.employee_id}"
"""

goal_content = """from django.db import models
from apps.platform.models.base import TenantModel
from apps.hrms_core.models import Employee

class Goal(TenantModel):
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('ACHIEVED', 'Achieved'),
        ('MISSED', 'Missed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')

    def __str__(self):
        return self.title
"""
with open(os.path.join(appraisal_models_dir, "__init__.py"), "w") as f: f.write(appraisal_init_content)
with open(os.path.join(appraisal_models_dir, "performance_review.py"), "w") as f: f.write(performance_review_content)
with open(os.path.join(appraisal_models_dir, "goal.py"), "w") as f: f.write(goal_content)

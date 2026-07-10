# yss_orbit\backend\apps\payroll\admin.py
from django.contrib import admin
from apps.payroll.models.payroll_run_model import PayrollRun
from apps.payroll.models.payslip import Payslip
from apps.payroll.models.tds_model import TDSSlab
from apps.payroll.models.salary_structure import SalaryStructure
from apps.payroll.models.salary_component_model import SalaryComponent

admin.site.register(PayrollRun)
admin.site.register(Payslip)
admin.site.register(TDSSlab)
admin.site.register(SalaryStructure)
admin.site.register(SalaryComponent)


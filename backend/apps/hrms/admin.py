# yss_orbit\backend\apps\hrms\admin.py
from django.contrib import admin
from .models import Department, Designation, Employee, EmployeeDocument

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code')
    search_fields = ('name', 'code')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee_code', 'first_name', 'last_name', 'department', 'employment_status')
    list_filter = ('employment_status', 'employment_type', 'department')
    search_fields = ('employee_code', 'first_name', 'last_name')

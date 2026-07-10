# yss_orbit\backend\apps\hrms\services\lifecycle_service.py
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
        # Offboarding logic like revoking access\n
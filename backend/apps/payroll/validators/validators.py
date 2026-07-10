# yss_orbit\backend\apps\payroll\validators\validators.py
from rest_framework.exceptions import ValidationError

class PayrollValidator:
    @staticmethod
    def validate_salary_components(components):
        if not components:
            raise ValidationError("Salary structure must have at least one component.")
        
        has_basic = any(c.get("code") == "BASIC" for c in components)
        if not has_basic:
            raise ValidationError("A BASIC component is required.")

    @staticmethod
    def validate_payroll_period(month, year):
        if not (1 <= month <= 12):
            raise ValidationError("Month must be between 1 and 12.")
        if year < 2000 or year > 2100:
            raise ValidationError("Invalid payroll year.")

# DEPRECATED - DO NOT USE. Scheduled for removal. Use apps.hrms instead.
# yss_orbit\backend\apps\hrms_core\services.py
from .models import CompanyPolicy

class HrmsCoreService:
    @staticmethod
    def get_active_policies(business_unit_id):
        return CompanyPolicy.objects.filter(business_unit_id=business_unit_id, is_active=True)

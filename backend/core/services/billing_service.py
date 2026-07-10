# yss_orbit\backend\core\services\billing_service.py
"""
Billing gateway service.
"""
from core.services.service_result import ServiceResult

class BillingService:
    @staticmethod
    def check_subscription_active(tenant_id: str) -> ServiceResult[bool]:
        return ServiceResult.success(True)

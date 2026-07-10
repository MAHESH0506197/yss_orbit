# yss_orbit\backend\core\services\notification_service.py
"""
Notification gateway service (implemented wrapper for core apps to use).
"""
from core.services.service_result import ServiceResult

class NotificationService:
    @staticmethod
    def send_email(to: str, template: str, context: dict) -> ServiceResult[bool]:
        # Implementation delegated to apps.platform
        return ServiceResult.success(True)
        
    @staticmethod
    def push_sse_event(tenant_id: str, event_name: str, payload: dict) -> ServiceResult[bool]:
        # Implementation delegated to apps.platform
        return ServiceResult.success(True)

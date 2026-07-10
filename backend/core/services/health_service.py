# yss_orbit\backend\core\services\health_service.py
"""
Health check service.
"""
from django.db import connection
from core.services.service_result import ServiceResult

class HealthService:
    @staticmethod
    def check_database() -> ServiceResult[bool]:
        """Check if database is reachable."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return ServiceResult.success(True)
        except Exception as e:
            return ServiceResult.failure(str(e), "DB_UNREACHABLE")

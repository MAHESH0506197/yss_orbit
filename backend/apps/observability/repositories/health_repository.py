# yss_orbit\backend\apps\health\repositories\health_repository.py
from apps.observability.models.health_model import SystemHealthLog

class HealthRepository:
    """
    Data Access Layer for SystemHealthLog.
    """
    @staticmethod
    def create_log(component_name: str, status: str, details: dict = None, response_time_ms: int = None) -> SystemHealthLog:
        return SystemHealthLog.objects.create(
            component_name=component_name,
            status=status,
            details=details or {},
            response_time_ms=response_time_ms
        )

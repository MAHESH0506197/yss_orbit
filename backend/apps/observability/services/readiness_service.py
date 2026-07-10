# yss_orbit\backend\apps\health\services\readiness_service.py
from apps.observability.services.health_service import HealthService

class ReadinessService:
    """
    Service strictly for determining deep application readiness.
    Ensures all critical dependencies are available before taking traffic.
    """
    @staticmethod
    def is_ready() -> bool:
        return HealthService.check_database() and HealthService.check_cache()

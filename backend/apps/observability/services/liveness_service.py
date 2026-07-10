# yss_orbit\backend\apps\health\services\liveness_service.py
from apps.observability.services.health_service import HealthService

class LivenessService:
    """
    Service strictly for determining basic application liveness without deep dependency checks.
    """
    @staticmethod
    def is_alive() -> bool:
        # A simple check, if Python reached here, it's alive.
        return True

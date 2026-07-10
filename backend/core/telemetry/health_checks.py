# yss_orbit\backend\core\telemetry\health_checks.py
"""
Advanced health checks for telemetry.
"""
from core.services.health_service import HealthService

class TelemetryHealthChecks:
    @staticmethod
    def get_system_health() -> dict:
        db_health = HealthService.check_database()
        return {
            "database": "UP" if db_health.is_success else "DOWN",
            "status": "UP" if db_health.is_success else "DEGRADED"
        }

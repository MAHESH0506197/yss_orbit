# yss_orbit\backend\apps\health\orchestrators\health_orchestrator.py
from apps.observability.services.health_service import HealthService
from apps.observability.services.dependency_health_service import DependencyHealthService

class HealthOrchestrator:
    """
    Combines internal DB/Cache checks with external dependency checks
    to provide a holistic view of the entire platform's health.
    """
    @staticmethod
    def get_full_platform_health() -> dict:
        internal = HealthService.get_comprehensive_status()
        external = DependencyHealthService.check_external_apis()
        
        overall_status = 'healthy'
        if internal['status'] != 'healthy' or any(v != 'healthy' for v in external.values()):
            overall_status = 'degraded'
            
        return {
            "overall_status": overall_status,
            "internal": internal,
            "external_dependencies": external
        }

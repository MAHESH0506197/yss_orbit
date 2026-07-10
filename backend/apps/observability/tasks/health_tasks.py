# yss_orbit\backend\apps\health\tasks\health_tasks.py
from celery import shared_task
from apps.observability.services.health_service import HealthService
from apps.observability.models.health_model import SystemHealthLog
from apps.observability.services.dependency_health_service import DependencyHealthService
import logging

logger = logging.getLogger(__name__)

@shared_task(name="health.periodic_health_check")
def periodic_health_check():
    """
    Background Celery task that runs every few minutes to assert platform health 
    and log the results to the database for metric retention.
    """
    logger.info("Executing periodic health check...")
    
    internal_data = HealthService.get_comprehensive_status()
    SystemHealthLog.objects.create(
        component_name="internal_systems",
        status=internal_data['status'],
        response_time_ms=internal_data.get('response_time_ms'),
        details=internal_data
    )
    
    external_data = DependencyHealthService.check_external_apis()
    for component, status in external_data.items():
        SystemHealthLog.objects.create(
            component_name=component,
            status=status,
            details={}
        )

# yss_orbit\backend\apps\health\management\commands\sync_health.py
from django.core.management.base import BaseCommand
from apps.observability.services.health_service import HealthService
from apps.observability.models.health_model import SystemHealthLog

class Command(BaseCommand):
    help = 'Forces an immediate execution of all system health checks and logs them.'

    def handle(self, *args, **options):
        self.stdout.write("Running comprehensive health check...")
        
        status_data = HealthService.get_comprehensive_status()
        
        # Log to DB
        SystemHealthLog.objects.create(
            component_name="overall_system",
            status=status_data['status'],
            details=status_data
        )

        if status_data['status'] == 'healthy':
            self.stdout.write(self.style.SUCCESS('All systems healthy!'))
        else:
            self.stdout.write(self.style.ERROR(f"System issues detected: {status_data}"))

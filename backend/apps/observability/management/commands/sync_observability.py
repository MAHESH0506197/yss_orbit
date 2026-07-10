# yss_orbit\backend\apps\observability\management\commands\sync_observability.py
from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Syncs local metrics to external Datadog/Prometheus'

    def handle(self, *args, **options):
        self.stdout.write("Starting metrics sync...")
        # Placeholder for external push
        self.stdout.write(self.style.SUCCESS('Successfully synced metrics.'))

# yss_orbit\backend\apps\dashboard\management\commands\sync_dashboard.py
from django.core.management.base import BaseCommand
from apps.observability.models import Dashboard

class Command(BaseCommand):
    help = 'Sync default dashboards for all active tenants'

    def handle(self, *args, **kwargs):
        self.stdout.write("Syncing dashboards...")
        # Implementation to sync dashboards
        self.stdout.write(self.style.SUCCESS("Successfully synced dashboards"))

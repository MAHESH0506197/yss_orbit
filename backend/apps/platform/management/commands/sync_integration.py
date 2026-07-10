# yss_orbit\backend\apps\integration\management\commands\sync_integration.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Executes sync_integration command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully executed sync_integration'))

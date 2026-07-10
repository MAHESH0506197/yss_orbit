# yss_orbit\backend\apps\business_unit\management\commands\sync_business_unit.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Sync data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Successfully synced.'))

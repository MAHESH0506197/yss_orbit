# yss_orbit\backend\apps\outbox\management\commands\sync_outbox.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Executes sync_outbox command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully executed sync_outbox'))

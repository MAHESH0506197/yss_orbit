# yss_orbit\backend\apps\outbox\management\commands\process_outbox.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Executes process_outbox command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully executed process_outbox'))

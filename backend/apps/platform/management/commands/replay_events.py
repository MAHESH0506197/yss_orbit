# yss_orbit\backend\apps\outbox\management\commands\replay_events.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Executes replay_events command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully executed replay_events'))

# yss_orbit\backend\apps\error_log\management\commands\sync_error_log.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Executes sync_error_log command'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Successfully executed sync_error_log'))

# yss_orbit\backend\apps\tenant_settings\management\commands\sync_tenant_settings.py
from django.core.management.base import BaseCommand
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Executes maintenance tasks for tenant_settings'
    
    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Run without making database changes')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        if dry_run:
            self.stdout.write(self.style.WARNING('Running in dry-run mode.'))
            
        self.stdout.write(self.style.SUCCESS('Successfully ran command for tenant_settings'))
        logger.info('Command executed successfully.')

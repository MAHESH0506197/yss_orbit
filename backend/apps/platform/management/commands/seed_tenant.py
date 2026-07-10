# yss_orbit\backend\apps\platform\management\commands\seed_tenant.py
import uuid
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.platform.seed.seed_runner import PlatformSeedRunner

class Command(BaseCommand):
    help = 'Seeds a specific tenant (business unit) with default data (settings, base roles, etc.)'

    def add_arguments(self, parser):
        parser.add_argument('business_unit_id', type=str, help='The UUID of the business unit to seed')

    @transaction.atomic
    def handle(self, *args, **options):
        bu_id_str = options['business_unit_id']
        
        try:
            bu_id = uuid.UUID(bu_id_str)
        except ValueError:
            raise CommandError(f'"{bu_id_str}" is not a valid UUID.')
            
        self.stdout.write(self.style.SUCCESS(f"Initiating Tenant Seed Runner for BU: {bu_id}..."))
        
        try:
            PlatformSeedRunner.run_tenant_seed(business_unit_id=bu_id, stdout=self.stdout)
            self.stdout.write(self.style.SUCCESS(f"Successfully seeded tenant {bu_id}."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to seed tenant: {e}"))
            raise e

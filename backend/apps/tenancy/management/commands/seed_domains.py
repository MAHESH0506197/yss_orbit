# yss_orbit\backend\apps\domain\management\commands\seed_domains.py
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.tenancy.models.domain_model import Domain

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seeds the database with initial core domains'

    def handle(self, *args, **options):
        self.stdout.write("Seeding default system domains...")
        try:
            with transaction.atomic():
                Domain.objects.get_or_create(
                    name='app.yssorbit.com',
                    defaults={
                        'is_primary': True,
                        'is_verified': True,
                        'ssl_enabled': True,
                        'ssl_status': 'active'
                    }
                )
            self.stdout.write(self.style.SUCCESS('Successfully seeded core domains.'))
        except Exception as e:
            logger.error(f"Failed to seed domains: {str(e)}")
            self.stdout.write(self.style.ERROR(f"Error seeding domains: {str(e)}"))

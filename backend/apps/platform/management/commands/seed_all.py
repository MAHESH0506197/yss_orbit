# yss_orbit\backend\apps\platform\management\commands\seed_all.py
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.platform.seed.seed_runner import PlatformSeedRunner

class Command(BaseCommand):
    help = 'Seeds the entire platform with base data (domains, permissions, roles, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force seeding even if data already exists',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        # We wrap the entire seeding process in an atomic transaction
        # to ensure it succeeds or fails completely.
        force = options['force']
        
        # Determine if we should proceed (e.g. check if already seeded unless forced)
        # For idempotency, the runner itself should handle "get_or_create" logic.
        
        self.stdout.write(self.style.SUCCESS("Initiating Platform Seed Runner..."))
        
        try:
            PlatformSeedRunner.run_all(stdout=self.stdout)
            self.stdout.write(self.style.SUCCESS('Successfully seeded the platform.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to seed platform: {e}"))
            raise e

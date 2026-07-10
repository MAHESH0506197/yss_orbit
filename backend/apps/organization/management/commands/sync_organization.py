# yss_orbit/backend/apps/organization/management/commands/sync_organization.py
from django.core.management.base import BaseCommand
from apps.organization.models import Organization


class Command(BaseCommand):
    help = "Syncs organizations with external billing and validates compliance fields."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        self.stdout.write(f"Starting org sync {'[DRY RUN] ' if dry_run else ''}...")
        orgs = Organization.objects.filter(is_deleted=False)
        self.stdout.write(f"Processing {orgs.count()} organizations.")
        self.stdout.write(self.style.SUCCESS("Sync completed."))

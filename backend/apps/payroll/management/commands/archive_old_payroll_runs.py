import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.payroll.models.payroll_run_model import PayrollRun

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Archives LOCKED payroll runs older than 7 years to optimize performance and preserve auditability."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run the archiving process without committing changes to the database.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # 7 years roughly 2555 days
        cutoff_date = timezone.now() - timedelta(days=2555)

        runs_to_archive = PayrollRun.objects.filter(
            status=PayrollRun.Status.LOCKED,
            created_at__lt=cutoff_date
        )
        
        count = runs_to_archive.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No old LOCKED payroll runs found to archive.'))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(f'[DRY-RUN] Found {count} payroll runs to archive.'))
            for run in runs_to_archive:
                self.stdout.write(f'  - Run ID: {run.id} | Month: {run.month}/{run.year} | Created: {run.created_at.date()}')
            return

        for run in runs_to_archive:
            run.status = PayrollRun.Status.ARCHIVED
            run.archived_at = timezone.now()
            run.save(update_fields=['status', 'archived_at'])
            
        self.stdout.write(self.style.SUCCESS(f'Successfully archived {count} old payroll runs.'))

# yss_orbit/backend/apps/subscription/management/commands/sync_modules_to_rbac.py
from django.core.management.base import BaseCommand
from apps.tenancy.models import PlatformModule
from apps.iam.models import RbacModule

class Command(BaseCommand):
    help = "Syncs existing PlatformModules (SaaS apps) to RbacModules for role assignment."

    def handle(self, *args, **options):
        platform_modules = PlatformModule.objects.all()
        created_count = 0
        updated_count = 0

        for pm in platform_modules:
            rbac_module, created = RbacModule.objects.update_or_create(
                code=pm.code,
                defaults={
                    'title': pm.name,
                    'description': pm.description,
                    'icon': pm.icon,
                    'is_active': pm.is_active,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created RbacModule for '{pm.name}'"))
            else:
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"Updated RbacModule for '{pm.name}'"))

        self.stdout.write(self.style.SUCCESS(f"Sync complete! Created: {created_count}, Updated: {updated_count}"))

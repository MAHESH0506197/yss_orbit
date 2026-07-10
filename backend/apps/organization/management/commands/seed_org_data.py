# yss_orbit/backend/apps/organization/management/commands/seed_org_data.py
"""
Management command to seed organizations with realistic dummy data.

IMPORTANT: This command only sets fields that exist on the Organization model.
Fields like address, GST, PAN, phone, website belong on BusinessUnit — not here.

Run: python manage.py seed_org_data
"""
from django.core.management.base import BaseCommand
from apps.organization.models import Organization, OrganizationSettings


# Only fields that exist on Organization / OrganizationSettings models.
ORGS = [
    {
        "slug":      "yss-orbit-platform",
        "org":       {"email": "platform@yss.in", "is_active": True},
        "settings":  {"enable_api_access": True, "enable_audit_log": True},
    },
    {
        "slug":      "nexus-tech",
        "org":       {"email": "admin@nexus.io", "is_active": True},
        "settings":  {"enable_api_access": True, "require_mfa": True},
    },
    {
        "slug":      "quantum-health",
        "org":       {"email": "ops@quantumhealth.co.uk", "is_active": True},
        "settings":  {"require_mfa": True, "enable_audit_log": True},
    },
    {
        "slug":      "stellar-logistics",
        "org":       {"email": "logistics@stellar.ae", "is_active": True},
        "settings":  {},
    },
    {
        "slug":      "paynex",
        "org":       {"email": "tech@paynex.com", "is_active": True},
        "settings":  {"enable_api_access": True, "require_mfa": True, "enable_audit_log": True},
    },
]


class Command(BaseCommand):
    help = "Seed Organization records with realistic dummy data (model-safe fields only)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO("\n  Seeding organization data...\n"))
        updated = skipped = errors = 0

        for entry in ORGS:
            slug = entry["slug"]
            try:
                org = Organization.all_objects.get(slug=slug)

                # Update org fields
                org_fields = entry.get("org", {})
                for k, v in org_fields.items():
                    setattr(org, k, v)
                if org_fields:
                    org.save(update_fields=list(org_fields.keys()) + ["updated_at"])

                # Update settings fields
                settings_data = entry.get("settings", {})
                if settings_data:
                    s, _ = OrganizationSettings.objects.get_or_create(organization=org)
                    for k, v in settings_data.items():
                        setattr(s, k, v)
                    s.save()

                updated += 1
                self.stdout.write(self.style.SUCCESS(f"  ✓  [{slug}]  {org.name}"))
            except Organization.DoesNotExist:
                skipped += 1
                self.stdout.write(self.style.WARNING(f"  –  [{slug}]  not found, skipped"))
            except Exception as exc:
                errors += 1
                self.stdout.write(self.style.ERROR(f"  ✗  [{slug}]  ERROR: {exc}"))

        self.stdout.write(self.style.HTTP_INFO(
            f"\n  Done: {updated} updated, {skipped} skipped, {errors} errors.\n"
        ))

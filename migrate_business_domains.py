import os
import sys
import django

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.business_domain.models import BusinessDomain
from apps.business_unit.models import BusinessUnit

def migrate_domains():
    bus = BusinessUnit.all_objects.all()
    count = 0
    domains = {}

    for bu in bus:
        industry = bu.industry or "OTHER"
        if industry not in domains:
            domain, created = BusinessDomain.objects.get_or_create(
                name=industry.capitalize(),
                defaults={
                    "code": f"DOM-{industry.upper()}",
                    "description": f"Auto-migrated domain for {industry}",
                    "icon": "Store",
                }
            )
            domains[industry] = domain
        
        bu.business_domain = domains[industry]
        bu.save(update_fields=['business_domain'])
        count += 1
        print(f"Mapped BU {bu.name} to Domain {domains[industry].name}")
        
    print(f"Successfully mapped {count} business units to domains.")

if __name__ == '__main__':
    migrate_domains()

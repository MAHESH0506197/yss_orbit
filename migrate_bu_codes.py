import os
import sys
import django
import re

sys.path.append(r'c:\PROJECT\yss_orbit\backend')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.business_unit.models import BusinessUnit

def migrate_bu_codes():
    bus = BusinessUnit.all_objects.all()
    count = 0
    for bu in bus:
        original_code = bu.code
        
        org_name = bu.organization.name if bu.organization else "ORG"
        org_prefix = re.sub(r'[^A-Z0-9]', '', org_name.upper())[:3]
        if not org_prefix:
            org_prefix = "ORG"
            
        name_prefix = re.sub(r'[^A-Z0-9]', '', bu.name.upper())
        if not name_prefix:
            name_prefix = "BU"
            
        new_code = f"BU-{org_prefix}-{name_prefix}"[:20]
        
        if bu.code != new_code:
            base_new_code = new_code
            suffix = 1
            while BusinessUnit.all_objects.filter(organization=bu.organization, code=new_code).exclude(id=bu.id).exists():
                suffix_str = f"-{suffix}"
                trim_len = 20 - len(suffix_str)
                new_code = f"{base_new_code[:trim_len]}{suffix_str}"
                suffix += 1
                
            bu.code = new_code
            bu.save(update_fields=['code'])
            count += 1
            print(f"Updated BU ID: {bu.id} | Name: {bu.name} | Code: {original_code} -> {new_code}")
            
    print(f"Successfully migrated {count} business units.")

if __name__ == '__main__':
    migrate_bu_codes()

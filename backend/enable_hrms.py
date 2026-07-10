import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.organization.models import BusinessUnit, BusinessUnitModule
from apps.tenancy.models import PlatformModule

print("Enabling HRMS for all Business Units...")
try:
    hrms_module, created = PlatformModule.objects.get_or_create(
        code="hrms",
        defaults={
            "name": "HRMS",
            "description": "Human Resource Management System",
            "is_active": True,
            "category": "HR"
        }
    )
    
    count = 0
    for bu in BusinessUnit.objects.all():
        BusinessUnitModule.objects.get_or_create(
            business_unit_id=bu.id,
            module=hrms_module,
            defaults={"status": BusinessUnitModule.Status.ACTIVE}
        )
        count += 1
        
    print(f"Successfully enabled HRMS for {count} Business Units!")
except Exception as e:
    import traceback
    traceback.print_exc()

import os
import sys
import django

sys.path.append(r'C:\PROJECT\yss_orbit\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.pqm.models.dropdown_option import PQMDropdownOption
qs = PQMDropdownOption.all_objects.all()
for o in qs:
    print(f"{o.field_type} - {o.name}")

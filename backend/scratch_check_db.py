import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from apps.pqm.models.dropdown_option import PQMDropdownOption
options = PQMDropdownOption.all_objects.all()
print("Options Count:", options.count())
for o in options:
    print(o.id, o.field_type, o.name)

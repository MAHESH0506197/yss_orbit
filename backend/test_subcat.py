import os
import sys
import django

# Setup Django
sys.path.append(r"c:\PROJECT\yss_orbit\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.pqm.models.dropdown_option import PQMDropdownOption, DropdownFieldType

# 1. Fetch all subcategories
subcats = PQMDropdownOption.objects.filter(field_type=DropdownFieldType.SUB_CATEGORY)
print(f"Total subcategories found: {subcats.count()}")

if subcats.exists():
    sc = subcats.first()
    print(f"Testing Sub-category: ID={sc.id}, Name={sc.name}, Parent={sc.system_mapping}")
    
    # Try updating
    try:
        sc.name = sc.name + " (Test)"
        sc.save()
        print("Update succeeded!")
    except Exception as e:
        print(f"Update failed: {e}")
        
    # Try deleting (soft delete)
    try:
        sc.delete()
        print("Delete succeeded!")
    except Exception as e:
        print(f"Delete failed: {e}")
else:
    print("No subcategories found. Creating one to test...")
    # Just mock testing

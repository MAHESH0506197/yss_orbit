import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.hrms_core.models import Employee as CoreEmployee
from apps.hrms.models import Employee as HrmsEmployee

core_ids = set(CoreEmployee.objects.values_list('id', flat=True))
hrms_ids = set(HrmsEmployee.objects.values_list('id', flat=True))

print("=== Employee ID Audit ===")
print(f"hrms_core_employee count: {len(core_ids)}")
print(f"hrms_employee count: {len(hrms_ids)}")

matching_ids = core_ids.intersection(hrms_ids)
print(f"matching ids: {len(matching_ids)}")

orphaned_ids = core_ids - hrms_ids
print(f"orphaned core ids: {len(orphaned_ids)}")

if orphaned_ids:
    print("\nWarning: The following core employee IDs do not exist in hrms:")
    for oid in list(orphaned_ids)[:10]:
        print(f" - {oid}")
    if len(orphaned_ids) > 10:
        print(f"   ... and {len(orphaned_ids) - 10} more.")

print("\n=== Event Audit ===")
# check for events in apps/hrms/events
import glob
events_files = glob.glob(os.path.join("apps", "hrms", "events", "*.py"))
if not events_files:
    print("No events directory or files found in apps.hrms")
else:
    print("Found event files:")
    for f in events_files:
        print(f" - {f}")
        with open(f, 'r') as file:
            content = file.read()
            for evt in ["EmployeeCreated", "EmployeeUpdated", "EmployeeTerminated", "EmployeeTransferred"]:
                if evt in content:
                    print(f"   [x] {evt}")
                else:
                    print(f"   [ ] {evt}")

print("\n=== Service Audit ===")
service_files = glob.glob(os.path.join("apps", "hrms", "services", "*.py"))
if not service_files:
    print("No service directory or files found in apps.hrms")
else:
    print("Found service files:")
    for f in service_files:
        print(f" - {f}")


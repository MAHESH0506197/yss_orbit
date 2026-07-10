import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.apps import apps
from django.db.models import Min, Max, Count
from django.utils.timezone import is_aware

def audit_table(model_class):
    count = model_class.objects.count()
    if count == 0:
        return {"count": 0}
        
    data = {"count": count}
    
    # Check for created_at
    has_created = hasattr(model_class, 'created_at')
    if has_created:
        agg = model_class.objects.aggregate(min=Min('created_at'), max=Max('created_at'))
        data['min_created'] = str(agg['min'])
        data['max_created'] = str(agg['max'])
        
    # Distinct Business Units
    has_bu = hasattr(model_class, 'business_unit') or hasattr(model_class, 'business_unit_id')
    if has_bu:
        field = 'business_unit_id' if hasattr(model_class, 'business_unit_id') else 'business_unit'
        data['distinct_bu'] = model_class.objects.values(field).distinct().count()
        
    # Try to find the latest record ID
    try:
        latest = model_class.objects.latest('created_at' if has_created else 'id')
        data['latest_id'] = str(latest.id)
    except Exception:
        pass
        
    return data

pairs = [
    ("Attendance Record", "hrms.AttendanceRecord", "attendance.AttendanceRecord"),
    ("Attendance Punch", "hrms.AttendancePunch", "attendance.AttendanceLog"),
    ("Leave Request", "hrms.LeaveRequest", "leave.LeaveApplication"),
    ("Leave Balance", "hrms.LeaveBalance", "leave.LeaveBalance"),
    ("Leave Type", "hrms.LeaveType", "leave.LeaveType"),
]

print("=== Row Count & FK Integrity Audit ===\n")

for name, hrms_path, legacy_path in pairs:
    hrms_app, hrms_model = hrms_path.split('.')
    legacy_app, legacy_model = legacy_path.split('.')
    
    print(f"--- {name} ---")
    try:
        HrmsModel = apps.get_model(hrms_app, hrms_model)
        LegacyModel = apps.get_model(legacy_app, legacy_model)
        
        hrms_data = audit_table(HrmsModel)
        legacy_data = audit_table(LegacyModel)
        
        print(f"HRMS ({hrms_path}):")
        for k, v in hrms_data.items(): print(f"  {k}: {v}")
            
        print(f"\nLegacy ({legacy_path}):")
        for k, v in legacy_data.items(): print(f"  {k}: {v}")
        print()
    except Exception as e:
        print(f"Error checking {name}: {e}\n")

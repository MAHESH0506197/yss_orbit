import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.apps import apps
from django.db import transaction

LegacyLeaveType = apps.get_model('leave', 'LeaveType')
HRMSLeaveType = apps.get_model('hrms', 'LeaveType')

LegacyLeaveBalance = apps.get_model('leave', 'LeaveBalance')
HRMSLeaveBalance = apps.get_model('hrms', 'LeaveBalance')

LegacyLeaveApplication = apps.get_model('leave', 'LeaveApplication')
HRMSLeaveRequest = apps.get_model('hrms', 'LeaveRequest')

def run_migration():
    with transaction.atomic():
        HRMSLeavePolicy = apps.get_model('hrms', 'LeavePolicy')
        legacy_ltype = LegacyLeaveType.objects.first()
        if not legacy_ltype:
            return
            
        policy, _ = HRMSLeavePolicy.objects.get_or_create(
            name="Default Legacy Policy",
            business_unit_id=legacy_ltype.business_unit_id,
            defaults={
                'is_active': True,
                'description': 'Migrated policy'
            }
        )

        # 1. Migrate LeaveTypes
        type_map = {}
        for ltype in LegacyLeaveType.objects.all():
            htype, created = HRMSLeaveType.objects.get_or_create(
                id=ltype.id,
                defaults={
                    'business_unit_id': ltype.business_unit_id,
                    'policy_id': policy.id,
                    'name': ltype.name,
                    'code': ltype.name.upper().replace(' ', '_')[:10],
                    'is_paid': True,
                    'is_active': True,
                }
            )
            type_map[ltype.id] = htype
            print(f"Migrated LeaveType: {htype.name}")

        HRMSEmployee = apps.get_model('hrms', 'Employee')

        # 2. Migrate LeaveBalances
        for lbal in LegacyLeaveBalance.objects.all():
            htype = type_map.get(lbal.leave_type_id)
            if not htype:
                continue
            if not HRMSEmployee.objects.filter(id=lbal.employee_id).exists():
                print(f"Skipping LeaveBalance for missing employee {lbal.employee_id}")
                continue
                
            hbal, created = HRMSLeaveBalance.objects.get_or_create(
                id=lbal.id,
                defaults={
                    'business_unit_id': lbal.business_unit_id,
                    'employee_id': lbal.employee_id,
                    'leave_type': htype,
                    'opening_balance': lbal.balance,
                    'accrued_days': 0,
                    'consumed_days': 0,
                    'closing_balance': lbal.balance,
                    'year': lbal.created_at.year,
                }
            )
            print(f"Migrated LeaveBalance for employee {hbal.employee_id}")

        # 3. Migrate LeaveApplications -> LeaveRequests
        for lapp in LegacyLeaveApplication.objects.all():
            htype = type_map.get(lapp.leave_type_id)
            if not htype:
                continue
            if not HRMSEmployee.objects.filter(id=lapp.employee_id).exists():
                print(f"Skipping LeaveApplication for missing employee {lapp.employee_id}")
                continue
            hreq, created = HRMSLeaveRequest.objects.get_or_create(
                id=lapp.id,
                defaults={
                    'business_unit_id': lapp.business_unit_id,
                    'employee_id': lapp.employee_id,
                    'leave_type': htype,
                    'start_date': lapp.start_date,
                    'end_date': lapp.end_date,
                    'reason': lapp.reason,
                    'status': lapp.status,
                    'manager_approved_by_id': lapp.approver_id,
                }
            )
            print(f"Migrated LeaveApplication {hreq.id}")

if __name__ == '__main__':
    run_migration()
    print("Data Migration Complete.")

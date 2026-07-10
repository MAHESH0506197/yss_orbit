import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yss_orbit.settings')
django.setup()

from apps.organization.models import BusinessUnit
from apps.iam.models.rbac_models import Role, Permission
from django.db.models import Q

def run():
    bu = BusinessUnit.objects.filter(name__icontains='Paynex HQ').first()
    if not bu:
        print('BU not found')
        sys.exit(1)

    def get_perms(*modules):
        return list(Permission.objects.filter(module__in=modules))

    def get_read_perms(*modules):
        return list(Permission.objects.filter(module__in=modules, code__icontains='view'))
        
    def get_manage_perms(*modules):
        # Exclude delete permissions for a more restricted 'manage' role
        return list(Permission.objects.filter(module__in=modules).exclude(code__icontains='delete'))

    role_definitions = [
        {
            'name': 'Chief Human Resources Officer (CHRO)',
            'department': 'Human Resources',
            'module': 'hrms',
            'perms': get_perms('hrms', 'payroll', 'leave', 'attendance', 'recruitment', 'appraisal', 'training')
        },
        {
            'name': 'HR Operations Manager',
            'department': 'Human Resources',
            'module': 'hrms',
            'perms': get_perms('hrms', 'leave', 'attendance', 'training') + get_read_perms('payroll', 'appraisal')
        },
        {
            'name': 'HR Generalist',
            'department': 'Human Resources',
            'module': 'hrms',
            'perms': get_manage_perms('hrms', 'leave', 'attendance')
        },
        {
            'name': 'Payroll & Compensation Manager',
            'department': 'Finance',
            'module': 'payroll',
            'perms': get_perms('payroll') + get_read_perms('hrms', 'leave', 'attendance', 'appraisal')
        },
        {
            'name': 'Payroll Executive',
            'department': 'Finance',
            'module': 'payroll',
            'perms': get_manage_perms('payroll') + get_read_perms('hrms', 'attendance')
        },
        {
            'name': 'Head of Talent Acquisition',
            'department': 'Talent Acquisition',
            'module': 'recruitment',
            'perms': get_perms('recruitment') + get_read_perms('hrms', 'appraisal')
        },
        {
            'name': 'Senior Recruiter',
            'department': 'Talent Acquisition',
            'module': 'recruitment',
            'perms': get_manage_perms('recruitment') + get_read_perms('hrms')
        },
        {
            'name': 'Time & Attendance Specialist',
            'department': 'Human Resources',
            'module': 'attendance',
            'perms': get_manage_perms('attendance', 'leave') + get_read_perms('hrms')
        },
        {
            'name': 'Performance Management Lead',
            'department': 'Human Resources',
            'module': 'appraisal',
            'perms': get_perms('appraisal') + get_read_perms('hrms', 'training')
        },
        {
            'name': 'Learning & Development Manager',
            'department': 'Human Resources',
            'module': 'training',
            'perms': get_perms('training') + get_read_perms('hrms', 'appraisal')
        },
        {
            'name': 'Employee Relations Specialist',
            'department': 'Human Resources',
            'module': 'hrms',
            'perms': get_read_perms('hrms', 'appraisal', 'leave', 'attendance')
        },
        {
            'name': 'HR Data Analyst (Read-Only)',
            'department': 'Human Resources',
            'module': 'hrms',
            'perms': get_read_perms('hrms', 'payroll', 'leave', 'attendance', 'recruitment', 'appraisal', 'training')
        }
    ]

    created_count = 0
    updated_count = 0
    for r_def in role_definitions:
        role, created = Role.objects.get_or_create(
            name=r_def['name'],
            business_unit_id=bu.id,
            defaults={
                'description': f'Automatically mapped role for {r_def["name"]} with precise RBAC controls.',
                'department_name': r_def['department'],
                'module_code': r_def['module'],
                'role_type': 'CUSTOM'
            }
        )
        role.permissions.set(r_def['perms'])
        if created:
            created_count += 1
            print(f"Created role {r_def['name']} with {len(r_def['perms'])} permissions.")
        else:
            updated_count += 1
            print(f"Updated role {r_def['name']} with {len(r_def['perms'])} permissions.")

    print(f'Successfully processed roles for Paynex HQ. Created: {created_count}, Updated: {updated_count}.')

if __name__ == '__main__':
    run()

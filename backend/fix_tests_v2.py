import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Replace kwargs across all test files
    content = content.replace('organization=tenant_org', 'organization_id=tenant_org.id')
    content = content.replace('business_unit=tenant_bu', 'business_unit_id=tenant_bu.id')
    content = content.replace('raised_by=default_user', 'raised_by_id=default_user.id')
    content = content.replace('assigned_to=assignee', 'assigned_to_id=assignee.id')
    content = content.replace('assigned_to=new_assignee', 'assigned_to_id=new_assignee.id')
    content = content.replace('project=pqm_project', 'project_id=pqm_project.id')

    # 2. Add pqm_site to fixture arguments if missing but pqm_project is there
    def replace_fixture_args(m):
        args = m.group(1)
        if 'pqm_project' in args and 'pqm_site' not in args:
            args = args.replace('pqm_project', 'pqm_project, pqm_site')
        return f'def {m.group(0)[4:m.group(0).find("(")]}({args}):'
    content = re.sub(r'def\s+test_\w+\((.*?)\):', replace_fixture_args, content)
    # same for fixtures
    content = re.sub(r'def\s+\w+\((.*?)\):', replace_fixture_args, content)

    # 3. Add site_id=pqm_site.id where project_id is
    if 'test_models.py' in filepath or 'test_api.py' in filepath or 'test_services.py' in filepath:
        content = content.replace('project_id=pqm_project.id,', 'project_id=pqm_project.id,\n            site_id=pqm_site.id,')

    # 4. Fix test_permissions.py
    if 'test_permissions.py' in filepath:
        content = content.replace('from apps.pqm.permissions import PQMPermission', 'from apps.pqm.permissions import PQMPermission, HasPQMPermission')
        content = content.replace('perm = PQMPermission()', 'perm = HasPQMPermission()\n        class MockView:\n            required_pqm_permission = PQMPermission.VIEW_NC')
        content = content.replace('perm.has_permission(request, None)', 'perm.has_permission(request, MockView())')

    # 5. Fix test_api.py missing user on context
    if 'test_api.py' in filepath:
        content = content.replace('def api_client(pqm_context):', 'def api_client(pqm_context, default_user):')
        content = content.replace('client.force_authenticate(user=pqm_context.user)', 'client.force_authenticate(user=default_user)')
        content = content.replace('str(pqm_context.active_business_unit.id)', 'str(pqm_context.business_unit_id)')

    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('apps/pqm/tests/*.py'):
    fix_file(filepath)
    print(f'Fixed {filepath}')

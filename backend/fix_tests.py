import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Add pqm_site to test functions if they have pqm_project but not pqm_site
    def replace_func(m):
        args = m.group(1)
        if 'pqm_project' in args and 'pqm_site' not in args:
            args = args.replace('pqm_project', 'pqm_project, pqm_site')
        return f'def {m.group(0)[4:m.group(0).find("(")]}({args}):'
    
    content = re.sub(r'def\s+test_\w+\((.*?)\):', replace_func, content)
    
    # Insert site_id
    content = content.replace('project_id=pqm_project.id,', 'project_id=pqm_project.id,\n            site_id=pqm_site.id,')
    
    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('apps/pqm/tests/*.py'):
    fix_file(filepath)
    print(f'Fixed {filepath}')

# yss_orbit\fix_apps.py
import os
import glob

apps_dir = r'c:\PROJECT\yss_orbit\backend\apps'
count = 0
for filepath in glob.glob(os.path.join(apps_dir, '*', 'apps.py')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "name = 'backend.apps." in content or 'name="backend.apps.' in content:
        print(f"Fixing name in {filepath}")
        content = content.replace("name = 'backend.apps.", "name = 'apps.")
        content = content.replace('name="backend.apps.', 'name="apps.')
        
        with open(filepath, 'w', encoding='utf-8') as out:
            out.write(content)
        count += 1

print(f"Fixed {count} apps.py files")

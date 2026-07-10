import os
import glob

base_dir = r"C:\PROJECT\yss_orbit\backend\apps"
py_files = glob.glob(os.path.join(base_dir, '**/*.py'), recursive=True)

for file in py_files:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'TimeStampedModel' in content:
            content = content.replace('from apps.platform.models.base import TimeStampedModel', 'from apps.platform.models import TenantModel')
            content = content.replace('(TimeStampedModel)', '(TenantModel)')
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
    except Exception as e:
        print(f"Error reading {file}: {e}")


import os
import glob

for f in glob.glob('c:/PROJECT/yss_orbit/frontend/src/**/*.ts*', recursive=True):
    if os.path.isfile(f):
        with open(f, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        
        if '@/features/roles' in content:
            new_content = content.replace('@/features/roles', '@/features/rbac')
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f'Updated {f}')

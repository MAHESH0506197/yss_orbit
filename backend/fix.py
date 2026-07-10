import os
import glob

target_dir = r'c:\PROJECT\yss_orbit\backend\apps'
files_to_check = []
for root, dirs, files in os.walk(target_dir):
    for f in files:
        if f.endswith('.py') and ('test' in f or 'conftest' in f or 'factories' in f):
            files_to_check.append(os.path.join(root, f))

for filepath in files_to_check:
    with open(filepath, 'r') as file:
        content = file.read()
    
    if r"\'" in content and 'BusinessDomain' in content:
        print(f'Unescaping quotes in {filepath}')
        new_content = content.replace(r"\'", "'")
        with open(filepath, 'w') as file:
            file.write(new_content)

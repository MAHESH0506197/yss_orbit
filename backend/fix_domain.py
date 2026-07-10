import os

target_dir = 'c:\\PROJECT\\yss_orbit\\backend\\apps'
files_to_check = []
for root, dirs, files in os.walk(target_dir):
    for f in files:
        if f.endswith('.py') and ('test' in f or 'conftest' in f or 'factories' in f):
            files_to_check.append(os.path.join(root, f))

for filepath in files_to_check:
    with open(filepath, 'r') as file:
        content = file.read()
    
    if "name='Test Domain', code='TEST'" in content or 'name="Retail", code="RET"' in content:
        print(f'Patching {filepath}')
        new_content = content.replace(
            "name='Test Domain', code='TEST'", 
            "name='Test Domain ' + __import__('uuid').uuid4().hex[:8], code='TEST' + __import__('uuid').uuid4().hex[:4]"
        ).replace(
            'name="Retail", code="RET"', 
            'name="Retail " + __import__("uuid").uuid4().hex[:8], code="RET" + __import__("uuid").uuid4().hex[:4]'
        )
        with open(filepath, 'w') as file:
            file.write(new_content)

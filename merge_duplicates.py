# yss_orbit\merge_duplicates.py
import os
import shutil

pairs = [
    ('business_units', 'business_unit'),
    ('notifications', 'notification'),
    ('organizations', 'organization'),
    ('webhooks', 'webhook')
]

base_dir = r"c:\PROJECT\yss_orbit\backend"

# Step 1: Copy files from plural to singular
for plural, singular in pairs:
    src_dir = os.path.join(base_dir, 'apps', plural)
    dst_dir = os.path.join(base_dir, 'apps', singular)
    
    if not os.path.exists(src_dir):
        print(f"Source {src_dir} does not exist.")
        continue
        
    if not os.path.exists(dst_dir):
        os.makedirs(dst_dir)
        
    for root, _, files in os.walk(src_dir):
        for file in files:
            src_file = os.path.join(root, file)
            # Calculate destination path
            rel_path = os.path.relpath(src_file, src_dir)
            dst_file = os.path.join(dst_dir, rel_path)
            
            dst_folder = os.path.dirname(dst_file)
            if not os.path.exists(dst_folder):
                os.makedirs(dst_folder)
                
            shutil.copy2(src_file, dst_file)
            print(f"Copied {src_file} -> {dst_file}")

# Step 2: Global Search and Replace in backend
# We want to replace:
# backend.apps.organizations -> backend.apps.organization
# apps.organizations -> apps.organization
# 'organizations' -> 'organization' (specifically in apps.py name field)

replace_map = {
    "backend.apps.business_units": "backend.apps.business_unit",
    "apps.business_units": "apps.business_unit",
    "name = 'backend.apps.business_units'": "name = 'backend.apps.business_unit'",
    "name='backend.apps.business_units'": "name='backend.apps.business_unit'",
    
    "backend.apps.notifications": "backend.apps.notification",
    "apps.notifications": "apps.notification",
    "name = 'backend.apps.notifications'": "name = 'backend.apps.notification'",
    "name='backend.apps.notifications'": "name='backend.apps.notification'",
    
    "backend.apps.organizations": "backend.apps.organization",
    "apps.organizations": "apps.organization",
    "name = 'backend.apps.organizations'": "name = 'backend.apps.organization'",
    "name='backend.apps.organizations'": "name='backend.apps.organization'",
    
    "backend.apps.webhooks": "backend.apps.webhook",
    "apps.webhooks": "apps.webhook",
    "name = 'backend.apps.webhooks'": "name = 'backend.apps.webhook'",
    "name='backend.apps.webhooks'": "name='backend.apps.webhook'",
}

# We also replace import references
for plural, singular in pairs:
    replace_map[f"from backend.apps.{plural}"] = f"from backend.apps.{singular}"
    replace_map[f"import backend.apps.{plural}"] = f"import backend.apps.{singular}"
    replace_map[f"from apps.{plural}"] = f"from apps.{singular}"

files_updated = 0
for root, dirs, files in os.walk(base_dir):
    # skip the old plural directories to avoid wasting time
    if any(p in root.split(os.sep) for p, _ in pairs):
        continue
        
    for file in files:
        if file.endswith('.py') or file.endswith('.txt') or file.endswith('.yaml'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                new_content = content
                for old_text, new_text in replace_map.items():
                    new_content = new_content.replace(old_text, new_text)
                    
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    files_updated += 1
            except Exception as e:
                pass

print(f"Updated {files_updated} files with new singular references.")

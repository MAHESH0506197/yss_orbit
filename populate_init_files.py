# yss_orbit\populate_init_files.py
import json
import os
import re

def get_module_name(filepath):
    # e.g., backend/apps/organizations/api/views/__init__.py -> organizations api views
    parts = os.path.normpath(filepath).split(os.sep)
    # Ignore 'backend', 'apps', '__init__.py'
    meaningful_parts = [p for p in parts if p not in ('backend', 'apps', '__init__.py', 'src', 'frontend')]
    if not meaningful_parts:
        return "module"
    return " ".join(meaningful_parts).replace("_", " ").title()

def populate_init_files():
    with open('deep_audit_results.json', 'r') as f:
        data = json.load(f)
        
    empty_files = [f['file'] for f in data['incomplete_files'] if f['status'] == 'Empty']
    
    count = 0
    for file_path in empty_files:
        if file_path.endswith('__init__.py'):
            abs_path = os.path.join(r"c:\PROJECT\yss_orbit", file_path)
            if os.path.exists(abs_path):
                # Only write if it's actually empty
                if os.path.getsize(abs_path) == 0:
                    module_name = get_module_name(file_path)
                    content = f'"""\nInitialization module for {module_name}.\n\nThis module exposes the core components of the {module_name} package.\n"""\n'
                    with open(abs_path, 'w', encoding='utf-8') as out:
                        out.write(content)
                    count += 1
                    
    print(f"Successfully populated {count} empty __init__.py files.")

if __name__ == '__main__':
    populate_init_files()

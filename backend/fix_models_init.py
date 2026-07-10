import os
import glob

base_dir = r"C:\PROJECT\yss_orbit\backend\apps"
apps = [
    'error_log',
    'api_consumer_key',
    'feature_flags',
    'integration',
    'jobs',
    'webhook'
]

# We need to look inside apps/<app>/models/*.py and import all classes into __init__.py
import ast

def extract_classes_from_file(filepath):
    classes = []
    with open(filepath, 'r') as f:
        try:
            tree = ast.parse(f.read())
            for node in tree.body:
                if isinstance(node, ast.ClassDef):
                    if 'Meta' not in node.name: # basic filter
                        classes.append(node.name)
        except:
            pass
    return classes

for app in apps:
    app_dir = os.path.join(base_dir, app)
    models_dir = os.path.join(app_dir, 'models')
    
    if os.path.exists(models_dir):
        init_file = os.path.join(models_dir, '__init__.py')
        init_lines = []
        
        # Find all .py files in models directory except __init__.py
        py_files = [f for f in os.listdir(models_dir) if f.endswith('.py') and f != '__init__.py']
        
        for py_file in py_files:
            module_name = py_file[:-3]
            filepath = os.path.join(models_dir, py_file)
            classes = extract_classes_from_file(filepath)
            if classes:
                init_lines.append(f"from .{module_name} import {', '.join(classes)}")
        
        # Write to __init__.py
        with open(init_file, 'w') as f:
            f.write("\n".join(init_lines) + "\n")
            
print("Fixed __init__.py files.")

import os
import ast
from pathlib import Path

BASE_DIR = Path('C:/PROJECT/yss_orbit/backend/apps')

def get_classes_from_file(filepath):
    classes = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read())
            for node in tree.body:
                if isinstance(node, ast.ClassDef):
                    if node.name != "Meta" and not node.name.endswith("Admin"):
                        classes.append(node.name)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
    return classes

for app_dir in BASE_DIR.iterdir():
    if not app_dir.is_dir() or app_dir.name == "__pycache__":
        continue
    
    # Generate __init__.py for models
    models_dir = app_dir / "models"
    if models_dir.exists():
        init_file = models_dir / "__init__.py"
        lines = []
        for py_file in models_dir.glob("*.py"):
            if py_file.name == "__init__.py":
                continue
            classes = get_classes_from_file(py_file)
            if classes:
                module_name = py_file.stem
                class_names = ", ".join(classes)
                lines.append(f"from .{module_name} import {class_names}")
                
        if lines:
            # Sort lines but put .user at the very top
            lines.sort(key=lambda x: (0 if '.user ' in x else 1, x))
            with open(init_file, 'w', encoding='utf-8') as f:
                f.write("\n".join(lines) + "\n")
            print(f"Updated {init_file.relative_to(BASE_DIR.parent)}")


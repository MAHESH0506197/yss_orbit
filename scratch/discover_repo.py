import os
import json
import re
from pathlib import Path

def scan_repo():
    backend_dir = Path(r"c:\PROJECT\yss_orbit\backend\apps")
    frontend_dir = Path(r"c:\PROJECT\yss_orbit\frontend\src")
    
    inventory = {
        "apps": {},
        "frontend": {}
    }
    
    if backend_dir.exists():
        for app_dir in backend_dir.iterdir():
            if app_dir.is_dir() and not app_dir.name.startswith("__"):
                app_name = app_dir.name
                inventory["apps"][app_name] = {
                    "models": [],
                    "views": [],
                    "urls": False,
                    "services": False,
                    "tests": False
                }
                
                models_py = app_dir / "models.py"
                if models_py.exists():
                    try:
                        content = models_py.read_text(encoding='utf-8')
                        models = re.findall(r'class\s+(\w+)\s*\(', content)
                        inventory["apps"][app_name]["models"] = [m for m in models if 'Meta' not in m and m != 'TimestampedModel']
                    except Exception:
                        pass
                
                views_py = app_dir / "views.py"
                if views_py.exists():
                    try:
                        content = views_py.read_text(encoding='utf-8')
                        views = re.findall(r'class\s+(\w+)\s*\(', content)
                        inventory["apps"][app_name]["views"] = [v for v in views]
                    except Exception:
                        pass
                
                if (app_dir / "urls.py").exists():
                    inventory["apps"][app_name]["urls"] = True
                if (app_dir / "services.py").exists():
                    inventory["apps"][app_name]["services"] = True
                if (app_dir / "tests").exists() or (app_dir / "tests.py").exists():
                    inventory["apps"][app_name]["tests"] = True

    if frontend_dir.exists():
        pages_dir = frontend_dir / "pages"
        if pages_dir.exists():
            for root, _, files in os.walk(pages_dir):
                for f in files:
                    if f.endswith(('.tsx', '.jsx')):
                        rel_path = os.path.relpath(os.path.join(root, f), pages_dir)
                        inventory["frontend"].setdefault("pages", []).append(rel_path)
                        
    Path(r"c:\PROJECT\yss_orbit\scratch\repo_inventory.json").write_text(json.dumps(inventory, indent=2), encoding='utf-8')

if __name__ == "__main__":
    scan_repo()

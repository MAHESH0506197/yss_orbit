# yss_orbit\backend\check_squad_e.py
import os

apps = ['billing', 'subscription', 'notification', 'audit', 'jobs', 'webhook', 'integration', 'reporting', 'dashboard']
base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

for app in apps:
    app_dir = os.path.join(base_dir, app)
    print(f"\n================ App: {app} ================")
    if not os.path.exists(app_dir):
        print("Missing directory")
        continue
    for root, dirs, files in os.walk(app_dir):
        if "__pycache__" in dirs:
            dirs.remove("__pycache__")
        if "migrations" in dirs:
            dirs.remove("migrations")
        for file in files:
            if file.endswith('.py') and file != "__init__.py":
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    print(f"--- {os.path.relpath(file_path, base_dir)} ({len(content.splitlines())} lines) ---")
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

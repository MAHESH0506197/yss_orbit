# yss_orbit\backend\fix_newlines.py
import os

apps = ['billing', 'subscription', 'notification', 'audit', 'jobs', 'webhook', 'integration', 'reporting', 'dashboard']
base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

for app in apps:
    app_dir = os.path.join(base_dir, app)
    if not os.path.exists(app_dir):
        continue
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if r"\n" in content:
                        content = content.replace(r"\n", "\n")
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                            print(f"Fixed {file_path}")
                except Exception as e:
                    pass

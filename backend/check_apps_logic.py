# yss_orbit\backend\check_apps_logic.py
import os
import glob
import json

APPS = ["users", "user_business_unit", "rbac", "organization", "business_unit", "tenancy", "platform", "feature_flags"]
BASE_DIR = r"c:/PROJECT/yss_orbit/backend/apps"

files_to_check = []
for app in APPS:
    app_dir = os.path.join(BASE_DIR, app)
    # Check services, views, serializers
    for root, dirs, files in os.walk(app_dir):
        if any(x in root for x in ["api\\views", "api/views", "api\\serializers", "api/serializers", "services"]):
            for file in files:
                if file.endswith(".py") and not file.startswith("__"):
                    files_to_check.append(os.path.join(root, file))

results = []
for file in files_to_check:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        if "pass" in content or "NotImplementedError" in content or "..." in content or "TODO" in content.upper():
            results.append(file)

with open("c:/PROJECT/yss_orbit/backend/missing_logic_files.json", "w") as f:
    json.dump(results, f, indent=4)

print(f"Found {len(results)} files potentially missing logic.")

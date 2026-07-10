# yss_orbit\find_small_files.py
import os

apps = ['batch_tracking', 'stock_transfer', 'vendor_management', 'pharmacy', 'drug_register', 'pharmacy_billing', 'expiry_tracking', 'hrms', 'hrms_core', 'attendance', 'leave', 'leave_management', 'payroll', 'recruitment', 'appraisal', 'reporting', 'dashboard', 'support']

base_dir = r"c:\PROJECT\yss_orbit\backend\apps"

for app in apps:
    app_dir = os.path.join(base_dir, app)
    if not os.path.exists(app_dir):
        continue
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                path = os.path.join(root, file)
                size = os.path.getsize(path)
                if size <= 150:
                    print(f"{path} ({size} bytes)")

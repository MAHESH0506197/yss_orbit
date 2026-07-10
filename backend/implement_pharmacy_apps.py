# yss_orbit\backend\implement_pharmacy_apps.py
import os

BASE_DIR = r"c:\PROJECT\yss_orbit\backend\apps"

apps_to_write = {
    "drug_register/apps.py": """from django.apps import AppConfig

class DrugRegisterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.drug_register'
""",
    "expiry_tracking/apps.py": """from django.apps import AppConfig

class ExpiryTrackingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.expiry_tracking'
""",
    "pharmacy/apps.py": """from django.apps import AppConfig

class PharmacyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pharmacy'
""",
    "pharmacy_billing/apps.py": """from django.apps import AppConfig

class PharmacyBillingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pharmacy_billing'
"""
}

for rel_path, content in apps_to_write.items():
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
print("Done writing apps.py.")

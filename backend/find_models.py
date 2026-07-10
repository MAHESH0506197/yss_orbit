# yss_orbit\backend\find_models.py
import os
import django
from django.apps import apps
from django.conf import settings

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

TARGET_APPS = ['batch_tracking', 'stock_transfer', 'vendor_management', 'pharmacy']

for app_name in TARGET_APPS:
    app_config = apps.get_app_config(app_name)
    models = app_config.get_models()
    model_names = [m.__name__ for m in models]
    print(f"App {app_name} models: {model_names}")

# yss_orbit\check_apps.py
import os
import re

apps_dir = r'c:\PROJECT\yss_orbit\backend\apps'
dirs = [d for d in os.listdir(apps_dir) if os.path.isdir(os.path.join(apps_dir, d)) and not d.startswith('__')]

with open(r'c:\PROJECT\yss_orbit\backend\config\settings\base.py', 'r') as f:
    content = f.read()

installed_apps = re.findall(r'"apps\.([a-zA-Z0-9_\.]+)"', content)
installed_apps_base = [a.split('.')[0] for a in installed_apps]

missing = set(dirs) - set(installed_apps_base)

# Filter out the plural duplicates we are going to delete anyway
plural_duplicates = {'business_units', 'notifications', 'organizations', 'webhooks'}
missing = missing - plural_duplicates

# Also filter out folders that are NOT apps but standard directories
non_apps = {'__pycache__'}
missing = missing - non_apps

print('Missing apps in INSTALLED_APPS:', missing)

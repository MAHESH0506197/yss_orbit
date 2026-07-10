import os
import shutil
import re

apps = [
    'api_consumer_key',
    'audit',
    'error_log',
    'feature_flags',
    'integration',
    'jobs',
    'webhook'
]

base_dir = r"C:\PROJECT\yss_orbit\backend\apps"

for app in apps:
    app_dir = os.path.join(base_dir, app, 'api')
    
    # 1. Fix serializers.py -> serializers/dev_serializers.py
    ser_file = os.path.join(app_dir, 'serializers.py')
    ser_dir = os.path.join(app_dir, 'serializers')
    dev_ser_file = os.path.join(ser_dir, 'dev_serializers.py')
    
    if os.path.exists(ser_file) and os.path.exists(ser_dir):
        shutil.move(ser_file, dev_ser_file)
        print(f"Moved {ser_file} to {dev_ser_file}")
    
    # 2. Fix views.py -> views/dev_views.py
    views_file = os.path.join(app_dir, 'views.py')
    views_dir = os.path.join(app_dir, 'views')
    dev_views_file = os.path.join(views_dir, 'dev_views.py')
    
    if os.path.exists(views_file) and os.path.exists(views_dir):
        # The subagent's views.py imports from .serializers which we just renamed
        with open(views_file, 'r') as f:
            content = f.read()
        content = content.replace('from .serializers', 'from ..serializers.dev_serializers')
        with open(dev_views_file, 'w') as f:
            f.write(content)
        os.remove(views_file)
        print(f"Moved {views_file} to {dev_views_file}")
    
    # 3. Fix urls.py to import from dev_views
    urls_file = os.path.join(app_dir, 'urls.py')
    if os.path.exists(urls_file):
        with open(urls_file, 'r') as f:
            content = f.read()
        content = content.replace('from .views', 'from .views.dev_views')
        with open(urls_file, 'w') as f:
            f.write(content)
        print(f"Updated {urls_file}")

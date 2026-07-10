import os, shutil
from pathlib import Path

BASE_DIR = Path('C:/PROJECT/yss_orbit/backend/apps')
APP_CONSOLIDATION_MAP = {
    'business_unit': 'organization',
    'business_domain': 'organization',
    'user_business_unit': 'organization',
    'tenant_module': 'tenancy',
    'tenant_settings': 'tenancy',
    'domain': 'tenancy',
    'subscription': 'tenancy',
    'users': 'iam',
    'rbac': 'iam',
    'security': 'iam',
    'core': 'platform',
    'platform_admin': 'platform',
    'branding': 'platform',
    'feature_flags': 'platform',
    'module_registry': 'platform',
    'api_consumer_key': 'platform',
    'file_storage': 'platform',
    'files': 'platform',
    'integration': 'platform',
    'webhook': 'platform',
    'notification': 'platform',
    'notifications': 'platform',
    'events': 'platform',
    'outbox': 'platform',
    'support': 'platform',
    'jobs': 'platform',
    'orchestration': 'platform',
    'health': 'observability',
    'dashboard': 'observability',
    'reporting': 'observability',
    'audit': 'compliance',
    'error_log': 'compliance',
}

def merge_app(old_p, new_p, old_name):
    for item in old_p.iterdir():
        if item.name in ('__pycache__', 'migrations'): continue
        
        if item.is_dir():
            dest_dir = new_p / item.name
            dest_dir.mkdir(parents=True, exist_ok=True)
            shutil.copytree(str(item), str(dest_dir), dirs_exist_ok=True)
        elif item.is_file() and item.suffix == '.py' and item.name not in ['__init__.py', 'apps.py']:
            if item.name == 'models.py':
                dest = new_p / 'models' / f'{old_name}_models.py'
            elif item.name == 'urls.py':
                dest = new_p / 'api' / 'urls' / f'{old_name}_urls.py'
            else:
                dest = new_p / f'{old_name}_{item.name}'
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists():
                shutil.copy2(str(item), str(dest))

for old, new in APP_CONSOLIDATION_MAP.items():
    old_p = BASE_DIR / old
    new_p = BASE_DIR / new
    if not old_p.exists(): continue
    new_p.mkdir(parents=True, exist_ok=True)
    merge_app(old_p, new_p, old)
    shutil.rmtree(str(old_p))

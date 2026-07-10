import os, re
from pathlib import Path

BASE_DIR = Path('C:/PROJECT/yss_orbit/backend')

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

for path in BASE_DIR.rglob("*.py"):
    if not path.is_file() or 'migrations' in path.parts: continue
    try:
        content = path.read_text(encoding='utf-8')
        new_content = content
        for old, new in APP_CONSOLIDATION_MAP.items():
            new_content = re.sub(rf'apps\.{old}\b', f'apps.{new}', new_content)
        
        # specific remapping for Platform models
        new_content = re.sub(r'from apps\.platform\.models import (.*?)(TenantModel|PlatformModel|CoreModel)(.*)', r'from apps.platform.models.base import \1\2\3', new_content)
        # specific remapping for Organization models
        new_content = re.sub(r'from apps\.organization\.models import (.*?)(Organization)(.*)', r'from apps.organization.models.organization_model import \1\2\3', new_content)
        # specific remapping for IAM models (break circular import)
        new_content = re.sub(r'from apps\.iam\.models import (.*?)(Role)(.*)', r'from apps.iam.models.rbac_models import \1\2\3', new_content)

        if content != new_content:
            path.write_text(new_content, encoding='utf-8')
    except Exception as e:
        pass

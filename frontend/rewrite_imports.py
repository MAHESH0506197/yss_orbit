import os
import re
from pathlib import Path

mapping = {
    'businessUnit': 'organization',
    'businessDomain': 'organization',
    'userBusinessUnit': 'organization',
    'tenantSettings': 'tenancy',
    'tenantDomains': 'tenancy',
    'tenantModule': 'tenancy',
    'moduleRegistry': 'tenancy',
    'modules': 'tenancy',
    'subscription': 'tenancy',
    'users': 'iam',
    'auth': 'iam',
    'rbac': 'iam',
    'admin': 'iam',
    'platformAdmin': 'platform',
    'fileStorage': 'platform',
    'branding': 'platform',
    'featureFlags': 'platform',
    'apiKeys': 'platform',
    'integration': 'platform',
    'notifications': 'platform',
    'support': 'platform',
    'dashboard': 'observability',
    'health': 'observability',
    'audit': 'compliance',
    'errorLog': 'compliance'
}

count = 0
for p in Path('C:/PROJECT/yss_orbit/frontend/src').rglob('*.*'):
    if p.suffix in ['.ts', '.tsx']:
        try:
            content = p.read_text(encoding='utf-8')
            new_content = content
            
            for child, parent in mapping.items():
                # Replace exact match `@/features/child/` or `@/features/child'`
                new_content = re.sub(
                    rf'@/features/{child}(/|[\'\"\;])',
                    rf'@/features/{parent}/{child}\1',
                    new_content
                )
                # Handle relative paths, e.g. `../../../features/child/`
                new_content = re.sub(
                    rf'([\.\/]+)features/{child}(/|[\'\"\;])',
                    rf'\1features/{parent}/{child}\2',
                    new_content
                )
            
            if content != new_content:
                p.write_text(new_content, encoding='utf-8')
                count += 1
                print(f'Updated imports in {p.name}')
        except Exception as e:
            print(f'Error on {p}: {e}')

print(f'Updated imports in {count} files.')

#!/usr/bin/env python
# yss_orbit\tools\architecture\validate_structure.py
"""
Architecture Structure Validator
Validates that the project structure adheres to enterprise standards.
Usage: python tools/architecture/validate_structure.py
"""
import os
import sys

REQUIRED_BACKEND_APPS = [
    'authentication', 'user', 'business_unit', 'organization', 'domain',
    'rbac', 'module_registry', 'tenant_module', 'tenant_settings',
    'billing', 'subscription', 'feature_flags', 'branding',
    'hrms_core', 'attendance', 'payroll', 'leave_management', 'appraisal', 'recruitment',
    'inventory', 'pos', 'retail_billing', 'pharmacy_billing', 'drug_register',
    'batch_tracking', 'expiry_tracking', 'stock_transfer', 'vendor_management',
    'reporting', 'analytics', 'dashboard',
    'notification', 'outbox', 'audit', 'observability', 'error_log',
    'file_storage', 'integration', 'webhook', 'api_consumer_key',
    'user_business_unit', 'platform_admin', 'health', 'support',
]

REQUIRED_APP_SUBDIRS = [
    'models', 'repositories', 'selectors', 'services', 'orchestrators',
    'events', 'api', 'validators', 'permissions', 'constants',
    'enums', 'tasks', 'tests', 'migrations', 'management',
]

FORBIDDEN_NAMES = ['bu_id', 'sector', 'MFA_REQUIRED']

def validate():
    errors = []
    apps_path = os.path.join('backend', 'apps')
    
    for app in REQUIRED_BACKEND_APPS:
        app_path = os.path.join(apps_path, app)
        if not os.path.isdir(app_path):
            errors.append(f'MISSING APP: {app}')
            continue
        for subdir in REQUIRED_APP_SUBDIRS:
            if not os.path.isdir(os.path.join(app_path, subdir)):
                errors.append(f'MISSING SUBDIR: {app}/{subdir}')
    
    if errors:
        print('VALIDATION FAILED:')
        for e in errors:
            print(f'  - {e}')
        sys.exit(1)
    else:
        print('Structure validation PASSED.')

if __name__ == '__main__':
    validate()

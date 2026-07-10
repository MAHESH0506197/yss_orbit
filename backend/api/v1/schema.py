# OpenAPI Schema configuration for YSS Orbit API v1
from drf_spectacular.utils import extend_schema_view
from drf_spectacular.openapi import AutoSchema

SPECTACULAR_SETTINGS = {
    'TITLE': 'YSS Orbit Enterprise SaaS API',
    'DESCRIPTION': 'Multi-tenant enterprise platform API. All endpoints require business_unit_id scope.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v1/',
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': True,
    'TAGS': [
        {'name': 'Authentication', 'description': 'JWT auth and MFA flows (B06)'},
        {'name': 'RBAC', 'description': 'Roles and permissions (B07)'},
        {'name': 'HRMS', 'description': 'HR management modules'},
        {'name': 'Commerce', 'description': 'Inventory, POS, billing modules'},
        {'name': 'Platform', 'description': 'Platform admin — SUPER_ADMIN only'},
    ],
}

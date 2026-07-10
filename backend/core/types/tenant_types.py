# yss_orbit\backend\core\types\tenant_types.py
"""
Tenancy type definitions.
"""
from typing import TypedDict, Optional

class TenantContext(TypedDict):
    tenant_id: str
    tenant_name: str
    schema_name: str
    domain: Optional[str]
    status: str

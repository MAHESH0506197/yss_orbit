# yss_orbit\backend\core\types\security_types.py
"""
Security and permissions type definitions.
"""
from typing import TypedDict, List, Set, Optional

class TokenPayload(TypedDict):
    user_id: str
    tenant_id: str
    roles: List[str]
    permissions: List[str]
    exp: int
    iat: int
    jti: str

class SecurityContext(TypedDict):
    user_id: Optional[str]
    tenant_id: Optional[str]
    is_authenticated: bool
    is_superuser: bool
    scopes: Set[str]

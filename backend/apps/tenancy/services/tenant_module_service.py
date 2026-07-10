import uuid
from typing import Dict, Any
from apps.tenancy.models import TenantModule

class TenantModuleService:
    @classmethod
    def process(cls, data: Dict[str, Any], user_id: str = "system") -> bool:
        return True

import logging
import uuid
import hashlib
from typing import Optional
from apps.platform.models import FeatureFlag
from apps.organization.models.organization_model import Organization

logger = logging.getLogger(__name__)

class FeatureFlagService:
    @classmethod
    def is_enabled(cls, flag_code: str, organization_id: Optional[uuid.UUID] = None) -> bool:
        try:
            flag = FeatureFlag.objects.get(code=flag_code)
        except FeatureFlag.DoesNotExist:
            return False

        # 1. Flag inactive
        if not flag.is_active:
            return False

        # 2. Globally enabled
        if flag.is_enabled_globally:
            return True

        if organization_id:
            org_id_str = str(organization_id)
            # 3. Explicitly allowed organizations
            if flag.allowed_organizations and org_id_str in flag.allowed_organizations:
                return True

            # 4. Plan code check
            # For simplicity, if organization exists and has a plan_code in allowed_plans
            if flag.allowed_plans:
                try:
                    org = Organization.objects.get(id=organization_id)
                    # Assumes Organization has a 'plan_code' attribute or similar. 
                    # If not, skip this check.
                    if hasattr(org, 'plan_code') and org.plan_code in flag.allowed_plans:
                        return True
                except Organization.DoesNotExist:
                    pass

            # 5. Rollout percentage
            if flag.rollout_percentage > 0:
                # Stable hash based on organization_id and flag_code
                hash_input = f"{org_id_str}-{flag_code}".encode('utf-8')
                hash_val = int(hashlib.sha256(hash_input).hexdigest(), 16)
                if (hash_val % 100) < flag.rollout_percentage:
                    return True

        # 6. Default to False
        return False

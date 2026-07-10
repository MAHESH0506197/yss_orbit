# yss_orbit\backend\apps\subscription\services\plan_enforcement_service.py
"""
YSS Orbit — Plan Enforcement Service
"""
from __future__ import annotations

import logging
import uuid

from apps.tenancy.services.subscription_service import SubscriptionService
from apps.platform.core_exceptions import PermissionDeniedException

logger = logging.getLogger(__name__)


class PlanEnforcementService:
    """Service for checking limits on the active subscription plan."""

    def __init__(self) -> None:
        self.sub_service = SubscriptionService()

    def enforce_users_limit(self, org_id: uuid.UUID, current_user_count: int) -> None:
        sub = self.sub_service.get_organization_subscription(org_id)
        if current_user_count >= sub.plan.max_users:
            raise PermissionDeniedException(f"User limit of {sub.plan.max_users} reached for plan {sub.plan.name}.")

    def enforce_business_units_limit(self, org_id: uuid.UUID, current_bu_count: int) -> None:
        sub = self.sub_service.get_organization_subscription(org_id)
        if current_bu_count >= sub.plan.max_business_units:
            raise PermissionDeniedException(f"Business unit limit of {sub.plan.max_business_units} reached for plan {sub.plan.name}.")
            
    def enforce_products_limit(self, org_id: uuid.UUID, current_product_count: int) -> None:
        sub = self.sub_service.get_organization_subscription(org_id)
        if current_product_count >= sub.plan.max_products:
            raise PermissionDeniedException(f"Product limit of {sub.plan.max_products} reached for plan {sub.plan.name}.")

    def enforce_storage_limit(self, org_id: uuid.UUID, current_storage_gb: float) -> None:
        sub = self.sub_service.get_organization_subscription(org_id)
        if current_storage_gb >= sub.plan.max_storage_gb:
            raise PermissionDeniedException(f"Storage limit of {sub.plan.max_storage_gb}GB reached for plan {sub.plan.name}.")

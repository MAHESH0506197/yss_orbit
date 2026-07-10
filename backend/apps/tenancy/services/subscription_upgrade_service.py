# yss_orbit\backend\apps\subscription\services\subscription_upgrade_service.py
"""
YSS Orbit — Subscription Upgrade Service
"""
from __future__ import annotations

import logging
import uuid

from django.db import transaction
from django.utils import timezone

from apps.tenancy.models import BusinessUnitSubscription, SubscriptionPlan
from apps.tenancy.services.subscription_service import SubscriptionService
from apps.platform.core_exceptions import ResourceNotFoundException, ValidationException
from apps.iam.security_context import SecurityContext

logger = logging.getLogger(__name__)


class SubscriptionUpgradeService:
    """Handles upgrading or downgrading a subscription."""

    def __init__(self) -> None:
        self.sub_service = SubscriptionService()

    @transaction.atomic
    def change_plan(self, security_ctx: SecurityContext, bu_id: uuid.UUID, new_plan_id: uuid.UUID, billing_cycle: str) -> BusinessUnitSubscription:
        """Upgrade or downgrade to a new plan."""
        current_sub = self.sub_service.get_business_unit_subscription(bu_id)

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise ResourceNotFoundException("Target SubscriptionPlan not found.")

        if billing_cycle not in ["MONTHLY", "YEARLY"]:
            raise ValidationException("Billing cycle must be MONTHLY or YEARLY.")

        # Cancel the old subscription
        now = timezone.now()
        current_sub.status = BusinessUnitSubscription.Status.EXPIRED
        current_sub.expires_at = now
        current_sub.is_active = False
        current_sub.updated_by_id = security_ctx.effective_user_id
        current_sub.save(update_fields=["status", "expires_at", "is_active", "updated_by_id", "updated_at"])

        # Create the new subscription
        amount = new_plan.price_monthly if billing_cycle == "MONTHLY" else new_plan.price_yearly
        
        new_sub = BusinessUnitSubscription(
            business_unit_id=bu_id,
            plan=new_plan,
            status=BusinessUnitSubscription.Status.ACTIVE,
            billing_cycle=billing_cycle,
            amount=amount,
            currency=new_plan.currency,
            started_at=now,
            current_period_start=now,
            # In a real app, calculate end period based on cycle
            current_period_end=now, 
            created_by_id=security_ctx.effective_user_id,
            updated_by_id=security_ctx.effective_user_id
        )
        new_sub.save()

        logger.info(f"Organization {org_id} changed plan to {new_plan.code} ({billing_cycle}).")
        return new_sub

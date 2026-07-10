import logging
from typing import Optional
import uuid
from django.db import transaction
from django.utils import timezone
from apps.tenancy.models import BusinessUnitSubscription, SubscriptionPlan
from apps.iam.security_context import SecurityContext

logger = logging.getLogger(__name__)

class SubscriptionService:
    def __init__(self, user=None):
        self.user = user

    @transaction.atomic
    def process(self, data: dict):
        logger.info(f"SubscriptionService processing data: {data}")
        return {"status": "processed", "data": data}

    def get_business_unit_subscription(self, business_unit_id: uuid.UUID) -> Optional[BusinessUnitSubscription]:
        """
        Get the most recent subscription for a Business Unit.
        """
        return BusinessUnitSubscription.objects.filter(business_unit_id=business_unit_id).order_by('-started_at').first()

    def start_trial(self, security_ctx: SecurityContext, business_unit_id: uuid.UUID, plan_code: str = "BASIC") -> BusinessUnitSubscription:
        """
        Start a 14-day trial for the specified plan.
        """
        # Ensure no active subscription exists
        subscription = BusinessUnitSubscription.objects.filter(business_unit_id=business_unit_id).order_by('-started_at').first()
        if subscription and subscription.status in [BusinessUnitSubscription.Status.ACTIVE, BusinessUnitSubscription.Status.TRIALING]:
            return subscription  # Already has an active sub/trial
            
        try:
            plan = SubscriptionPlan.objects.get(code=plan_code)
        except SubscriptionPlan.DoesNotExist:
            from apps.platform.core_exceptions import ValidationException
            raise ValidationException(f"Plan {plan_code} does not exist.")

        trial_ends = timezone.now() + timezone.timedelta(days=14)
        new_sub = BusinessUnitSubscription.objects.create(
            business_unit_id=business_unit_id,
            plan=plan,
            status=BusinessUnitSubscription.Status.TRIALING,
            billing_cycle="MONTHLY",
            amount=0,
            trial_ends_at=trial_ends,
            current_period_start=timezone.now(),
            current_period_end=trial_ends,
            created_by_id=security_ctx.user_id,
        )
        return new_sub

    def cancel_subscription(self, security_ctx: SecurityContext, business_unit_id: uuid.UUID) -> BusinessUnitSubscription:
        """
        Cancel the active subscription immediately.
        """
        subscription = self.get_business_unit_subscription(business_unit_id)
        if not subscription:
            from apps.platform.core_exceptions import ValidationException
            raise ValidationException("No subscription found.")
            
        subscription.status = BusinessUnitSubscription.Status.CANCELLED
        subscription.cancelled_at = timezone.now()
        subscription.updated_by_id = security_ctx.user_id
        subscription.save()
        return subscription

    @transaction.atomic
    def enforce_gating(self, business_unit_id: uuid.UUID):
        logger.info(f"Enforcing strict SaaS subscription gating for business unit {business_unit_id}")
        subscription = BusinessUnitSubscription.objects.filter(business_unit_id=business_unit_id).order_by('-started_at').first()
        if not subscription or subscription.status not in [BusinessUnitSubscription.Status.ACTIVE, BusinessUnitSubscription.Status.TRIALING]:
            raise ValueError("Business unit does not have an active subscription.")
            
        if subscription.current_period_end and subscription.current_period_end < timezone.now():
            raise ValueError("Business unit subscription has expired.")
            
        return True

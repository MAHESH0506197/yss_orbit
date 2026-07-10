# yss_orbit\backend\apps\subscription\orchestrators\subscription_orchestrator.py
import uuid
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.tenancy.models import BusinessUnitSubscription, SubscriptionPlan
from apps.platform.event_bus import EventBus

class SubscriptionOrchestrator:
    @transaction.atomic
    def upgrade_subscription(
        self,
        business_unit_id: uuid.UUID,
        new_plan_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> BusinessUnitSubscription:
        # Get current subscription
        current_sub = BusinessUnitSubscription.objects.filter(
            business_unit_id=business_unit_id, 
            status__in=[BusinessUnitSubscription.Status.TRIALING, BusinessUnitSubscription.Status.ACTIVE]
        ).first()

        new_plan = SubscriptionPlan.objects.get(id=new_plan_id)

        if current_sub:
            current_sub.status = BusinessUnitSubscription.Status.CANCELLED
            current_sub.cancelled_at = timezone.now()
            current_sub.save(update_fields=["status", "cancelled_at"])

        # Create new subscription
        new_sub = BusinessUnitSubscription.objects.create(
            business_unit_id=business_unit_id,
            plan=new_plan,
            status=BusinessUnitSubscription.Status.ACTIVE,
            billing_cycle="MONTHLY",
            amount=new_plan.price_monthly,
            currency=new_plan.currency,
        )

        # In a real app we'd activate modules here via PlanModule. 
        # Since this is an orchestrator, it orchestrates multiple services.
        
        # Publish event
        EventBus.publish(
            event_type="subscription.upgraded",
            aggregate_id=str(new_sub.id),
            aggregate_type="BusinessUnitSubscription",
            business_unit_id=business_unit_id,
            payload={
                "plan_code": new_plan.code,
                "amount": float(new_sub.amount)
            },
        )
        
        return new_sub

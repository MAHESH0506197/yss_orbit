# yss_orbit\backend\apps\subscription\services\grace_period_service.py
"""
YSS Orbit — Grace Period Service
"""
from __future__ import annotations

import logging
import uuid
from datetime import timedelta

from django.utils import timezone
from django.db import transaction

from apps.tenancy.models import BusinessUnitSubscription
from apps.tenancy.services.subscription_service import SubscriptionService
from apps.iam.security_context import SecurityContext

logger = logging.getLogger(__name__)


class GracePeriodService:
    """Service for managing subscription grace periods for overdue payments."""

    def __init__(self) -> None:
        self.sub_service = SubscriptionService()

    @transaction.atomic
    def apply_grace_period(self, security_ctx: SecurityContext, sub: BusinessUnitSubscription) -> bool:
        """
        Move a subscription to PAST_DUE if it's currently ACTIVE and unpaid.
        If it's already PAST_DUE and the grace period has expired, move it to EXPIRED.
        Returns True if the status was changed, False otherwise.
        """
        now = timezone.now()

        # 1. From ACTIVE to PAST_DUE
        if sub.status == BusinessUnitSubscription.Status.ACTIVE:
            if sub.current_period_end and now > sub.current_period_end:
                sub.status = BusinessUnitSubscription.Status.PAST_DUE
                sub.updated_by_id = security_ctx.effective_user_id
                sub.save(update_fields=["status", "updated_by_id", "updated_at"])
                return True

        # 2. From PAST_DUE to EXPIRED (assuming a 7-day grace period)
        elif sub.status == BusinessUnitSubscription.Status.PAST_DUE:
            if sub.current_period_end:
                grace_period_end = sub.current_period_end + timedelta(days=7)
                if now > grace_period_end:
                    sub.status = BusinessUnitSubscription.Status.EXPIRED
                    sub.updated_by_id = security_ctx.effective_user_id
                    sub.is_active = False
                    sub.expires_at = now
                    sub.save(update_fields=["status", "is_active", "expires_at", "updated_at", "updated_by_id"])
                    return True

        return False

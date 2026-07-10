# yss_orbit\backend\apps\subscription\models.py
"""
YSS Orbit — Platform Catalogue
Defines available modules, features, and their subscription gates.
This is the platform registry — not tenant-specific.
"""
from __future__ import annotations

import uuid

from django.db import models

from apps.platform.models.base import PlatformModel


class PlatformModule(PlatformModel):
    """
    Registry of all platform modules available for subscription.
    Populated by seed data — not user-editable.
    """

    class ModuleCategory(models.TextChoices):
        CORE = "CORE", "Core (Always included)"
        BUSINESS = "BUSINESS", "Business Operations"
        HRMS = "HRMS", "Human Resources"
        FINANCE = "FINANCE", "Finance"
        ANALYTICS = "ANALYTICS", "Analytics & Reporting"
        INTEGRATIONS = "INTEGRATIONS", "Integrations"

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="e.g. 'inventory', 'hrms', 'pos'",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=ModuleCategory.choices)
    icon = models.CharField(max_length=50, blank=True)  # Lucide icon name
    is_free = models.BooleanField(default=False)  # Always available in all plans
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta(PlatformModel.Meta):
        db_table = "platform_modules"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class SubscriptionPlan(PlatformModel):
    """Platform subscription plans (FREE, BASIC, PRO, ENTERPRISE)."""

    code = models.CharField(max_length=20, unique=True)  # FREE, BASIC, PRO, ENTERPRISE
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="INR")

    # Plan limits
    max_users = models.PositiveIntegerField(default=5)
    max_business_units = models.PositiveIntegerField(default=1)
    max_products = models.PositiveIntegerField(default=100)
    max_api_calls_per_day = models.PositiveIntegerField(default=1000)
    max_storage_gb = models.PositiveIntegerField(default=1)

    # Included modules
    modules = models.ManyToManyField(
        PlatformModule,
        through="PlanModule",
        blank=True,
    )

    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta(PlatformModel.Meta):
        db_table = "subscription_plans"
        ordering = ["sort_order", "price_monthly"]


class PlanModule(models.Model):
    """Through model for SubscriptionPlan ↔ PlatformModule."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    module = models.ForeignKey(PlatformModule, on_delete=models.CASCADE)
    is_included = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "plan_modules"
        unique_together = [("plan", "module")]


class BusinessUnitSubscription(PlatformModel):
    """
    Active subscription for a Business Unit.
    One subscription per BU at a time (upgrades/downgrades create new records).
    """

    class Status(models.TextChoices):
        TRIALING = "TRIALING", "Trial"
        ACTIVE = "ACTIVE", "Active"
        PAST_DUE = "PAST_DUE", "Past Due"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    business_unit_id = models.UUIDField(db_index=True)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.TRIALING, db_index=True)

    # Billing
    billing_cycle = models.CharField(max_length=10, choices=[("MONTHLY", "Monthly"), ("YEARLY", "Yearly")], default="MONTHLY")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="INR")

    # Razorpay
    razorpay_subscription_id = models.CharField(max_length=100, blank=True)
    razorpay_customer_id = models.CharField(max_length=100, blank=True)

    # Dates
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta(PlatformModel.Meta):
        db_table = "business_unit_subscriptions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business_unit_id", "status"]),
        ]

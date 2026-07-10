# yss_orbit\backend\apps\subscription\admin.py
# FIX (IMPLEMENTATION_PLAN.md item 3/4): apps.tenancy.models'
# PlatformModule, SubscriptionPlan, PlanModule, and OrganizationSubscription
# were entirely unregistered — the global module/plan catalogue (seeded by
# seed_modules.py / seed_subscription_plans.py, see
# apps/platform/seed/) had no admin visibility at all.
#
# Imports from apps.tenancy.models (the PACKAGE, models/__init__.py —
# NOT the sibling models.py file, which is dead/shadowed code, see BUG-32
# in IMPLEMENTATION_PLAN.md).
from django.contrib import admin
from apps.tenancy.models import (
    PlatformModule, SubscriptionPlan, PlanModule, BusinessUnitSubscription,
)


class PlanModuleInline(admin.TabularInline):
    """Inline editor for a plan's module entitlements (PlanModule.is_included)."""
    model = PlanModule
    extra = 0
    autocomplete_fields = ("module",)


@admin.register(PlatformModule)
class PlatformModuleAdmin(admin.ModelAdmin):
    """
    Read-mostly registry — seeded by seed_modules.py (idempotent, additive).
    `code` is the stable identifier used by BusinessUnitModule.module,
    ModuleSubscriptionMiddleware._MODULE_PATH_MAP, and
    module_dependency_validator.MODULE_DEPENDENCIES — changing it here
    without updating those would silently break dependency resolution and
    middleware gating, so `code` is read-only.
    """
    list_display = ("sort_order", "code", "name", "category", "is_active", "is_free")
    list_filter = ("category", "is_active", "is_free")
    search_fields = ("code", "name", "description")
    readonly_fields = ("id", "code", "created_at")
    ordering = ("sort_order", "name")
    list_editable = ("is_active", "is_free")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        "sort_order", "code", "name", "price_monthly", "price_yearly",
        "max_users", "max_business_units", "is_active", "is_featured",
    )
    list_filter = ("is_active", "is_featured")
    search_fields = ("code", "name")
    readonly_fields = ("id", "code", "created_at")
    ordering = ("sort_order", "price_monthly")
    inlines = [PlanModuleInline]


@admin.register(BusinessUnitSubscription)
class BusinessUnitSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "business_unit_id", "plan", "status", "billing_cycle", "amount",
        "current_period_end", "trial_ends_at",
    )
    list_filter = ("status", "billing_cycle", "plan")
    search_fields = ("business_unit_id", "razorpay_subscription_id", "razorpay_customer_id")
    list_select_related = ("plan",)
    readonly_fields = ("id", "business_unit_id", "started_at", "created_at", "updated_at")
    ordering = ("-created_at",)

# yss_orbit\backend\apps\platform\seed\seed_subscription_plans.py
"""
YSS Orbit — SubscriptionPlan & PlanModule Seed

FIX (was an empty 3-line stub): Implements run_seed(stdout) to populate the
4-tier SubscriptionPlan table (FREE/BASIC/PRO/ENTERPRISE) per the E04
standard, plus PlanModule rows defining which PlatformModule codes each
plan includes.

Depends on apps.platform.seed.seed_modules having run first (PlanModule FKs
to PlatformModule by code — if a code isn't in the registry yet, it's
skipped with a warning rather than crashing; seed_runner.py's documented
order is seed_modules → seed_subscription_plans, but this is defensive in
case of a partial/out-of-order run).

PLAN TIERS (from IMPLEMENTATION_PLAN.md):
  FREE       — 5 users,   1 BU,   1 paid module  + all is_free modules
  BASIC      — 25 users,  3 BUs,  3 paid modules + all is_free modules
  PRO        — 100 users, 10 BUs, all 18 modules
  ENTERPRISE — unlimited (represented as a very high cap),  all 18 modules

"max_modules" isn't a literal SubscriptionPlan field (the model has
max_users/max_business_units/max_products/max_api_calls_per_day/
max_storage_gb) — module ENTITLEMENT is expressed via PlanModule rows
(is_included=True/False), which is what PlanEnforcementService-style checks
and the BusinessUnitModule activation API (business_unit_module_view.py)
query to decide whether a BU's organization's plan permits activating a
given module. FREE/BASIC's "N modules of choice" is represented by including
ALL non-free modules as PlanModule(is_included=False) placeholder rows PLUS
a curated default set as is_included=True — giving the activation API a
complete (plan, module) matrix to check rather than "absence = not
entitled" (which would be ambiguous between "not on this plan" and "seed
incomplete").
"""
from __future__ import annotations

from decimal import Decimal

from apps.tenancy.models import PlatformModule, SubscriptionPlan, PlanModule

# Unlimited is represented as this sentinel for integer plan-limit fields.
UNLIMITED = 2_147_483_647  # PositiveIntegerField max (2^31 - 1)

PLAN_CATALOGUE: list[dict] = [
    {
        "code": "FREE",
        "name": "Free",
        "description": "Single business unit, core platform features.",
        "price_monthly": Decimal("0"),
        "price_yearly": Decimal("0"),
        "max_users": 5,
        "max_business_units": 1,
        "max_products": 100,
        "max_api_calls_per_day": 1000,
        "max_storage_gb": 1,
        "sort_order": 0,
        "is_featured": False,
        # Curated default beyond the always-free set (core/notifications/reporting).
        "included_modules": ["pos"],
    },
    {
        "code": "BASIC",
        "name": "Basic",
        "description": "Small business — up to 3 business units, choice of 3 paid modules.",
        "price_monthly": Decimal("999"),
        "price_yearly": Decimal("9999"),
        "max_users": 25,
        "max_business_units": 3,
        "max_products": 1000,
        "max_api_calls_per_day": 10000,
        "max_storage_gb": 10,
        "sort_order": 1,
        "is_featured": False,
        "included_modules": ["pos", "inventory", "hrms"],
    },
    {
        "code": "PRO",
        "name": "Pro",
        "description": "Growing business — up to 10 business units, all modules included.",
        "price_monthly": Decimal("2999"),
        "price_yearly": Decimal("29999"),
        "max_users": 100,
        "max_business_units": 10,
        "max_products": 10000,
        "max_api_calls_per_day": 100000,
        "max_storage_gb": 100,
        "sort_order": 2,
        "is_featured": True,
        "included_modules": "__all__",
    },
    {
        "code": "ENTERPRISE",
        "name": "Enterprise",
        "description": "Unlimited scale — all modules, dedicated support.",
        "price_monthly": Decimal("9999"),
        "price_yearly": Decimal("99999"),
        "max_users": UNLIMITED,
        "max_business_units": UNLIMITED,
        "max_products": UNLIMITED,
        "max_api_calls_per_day": UNLIMITED,
        "max_storage_gb": UNLIMITED,
        "sort_order": 3,
        "is_featured": False,
        "included_modules": "__all__",
    },
]


def run_seed(stdout) -> None:
    """
    Entry point invoked by apps.platform.seed.seed_runner.PlatformSeedRunner.
    """
    all_module_codes = list(PlatformModule.objects.values_list("code", flat=True))
    free_module_codes = set(
        PlatformModule.objects.filter(is_free=True).values_list("code", flat=True)
    )

    if not all_module_codes:
        stdout.write(
            "  SubscriptionPlan seed: PlatformModule registry is empty — "
            "run seed_modules first. Skipping PlanModule entitlements "
            "(SubscriptionPlan rows will still be created)."
        )

    plans_created, plans_updated = 0, 0
    plan_modules_created = 0

    for spec in PLAN_CATALOGUE:
        included = spec["included_modules"]
        plan_defaults = {
            "name": spec["name"],
            "description": spec["description"],
            "price_monthly": spec["price_monthly"],
            "price_yearly": spec["price_yearly"],
            "currency": "INR",
            "max_users": spec["max_users"],
            "max_business_units": spec["max_business_units"],
            "max_products": spec["max_products"],
            "max_api_calls_per_day": spec["max_api_calls_per_day"],
            "max_storage_gb": spec["max_storage_gb"],
            "sort_order": spec["sort_order"],
            "is_featured": spec["is_featured"],
            "is_active": True,
        }

        plan, was_created = SubscriptionPlan.objects.get_or_create(
            code=spec["code"], defaults=plan_defaults,
        )
        if was_created:
            plans_created += 1
        else:
            changed = False
            for field, value in plan_defaults.items():
                if getattr(plan, field) != value:
                    setattr(plan, field, value)
                    changed = True
            if changed:
                plan.save()
                plans_updated += 1

        if not all_module_codes:
            continue

        # Resolve the set of codes this plan INCLUDES.
        if included == "__all__":
            included_codes = set(all_module_codes)
        else:
            included_codes = set(included) | free_module_codes

        # Build a PlanModule row for EVERY module (is_included True/False) —
        # see module docstring for why "absence = not entitled" is avoided.
        for module in PlatformModule.objects.filter(code__in=all_module_codes):
            is_included = module.code in included_codes
            _pm, pm_created = PlanModule.objects.get_or_create(
                plan=plan, module=module, defaults={"is_included": is_included},
            )
            if pm_created:
                plan_modules_created += 1
            elif _pm.is_included != is_included:
                _pm.is_included = is_included
                _pm.save(update_fields=["is_included"])

    stdout.write(
        f"  SubscriptionPlan: {plans_created} created, {plans_updated} updated "
        f"({len(PLAN_CATALOGUE)} total). PlanModule entitlements: "
        f"{plan_modules_created} created."
    )

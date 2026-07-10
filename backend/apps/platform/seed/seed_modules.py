# yss_orbit\backend\apps\platform\seed\seed_modules.py
"""
YSS Orbit — PlatformModule Registry Seed

FIX (was an empty 3-line stub): Implements run_seed(stdout) to populate the
PlatformModule registry — the table E04 §3.1 calls the "Module Registry"
and the FK target of apps.organization.models.BusinessUnitModule.module
(the table ModuleSubscriptionMiddleware actually reads).

CANONICAL 18-MODULE LIST — derived by cross-referencing 4 existing sources
in the codebase (documented in full in IMPLEMENTATION_PLAN.md):
  1. ModuleSubscriptionMiddleware._MODULE_PATH_MAP (14 URL-gated codes —
     the "must exist" set, since the middleware 403s on any of these if
     the corresponding PlatformModule/BusinessUnitModule row is missing)
  2. apps.platform.catalogue.module_catalogue.ModuleCatalogue.MODULES
     (domain-keyed sub-module groupings: hrms→payroll/attendance/recruitment,
     pos→inventory/customers, pharmacy→drug_register/pharmacy_billing)
  3. apps.platform.catalogue.domain_catalogue.DomainCatalogue.DOMAINS
     (hrms, pos, pharmacy, real_estate)
  4. apps.iam.management.commands.sync_rbac.PERMISSION_CATALOGUE module
     groups (organization, business_unit, rbac, users, platform, hrms,
     payroll + legacy attendance/leave/training/recruitment/appraisal/
     inventory/pharmacy/billing/pos/reporting/support)

depends_on (E04 §3.4): module codes this module requires to be ACTIVE on
the same BusinessUnit before it can itself be activated. Enforced by
apps.platform.governance.module_dependency_validator.validate_activation().

is_free (PlatformModule.is_free): "Always available in all plans" —
core/notifications/reporting are free; everything else requires a plan
that includes the code (PlanModule.is_included, see seed_subscription_plans.py).

Idempotent: get_or_create on `code` (unique). Re-running updates name/
description/category/icon/sort_order/is_free if they drift, never deletes —
BusinessUnitModule rows FK to PlatformModule with on_delete=PROTECT-equivalent
caution (see business_unit_module.py: the FK has no explicit on_delete
override beyond Django's default CASCADE on the FK itself, but deleting a
PlatformModule row that has live BusinessUnitModule references would cascade-
delete tenant subscription data — hence additive-only).
"""
from __future__ import annotations

from apps.tenancy.models import PlatformModule

# (code, name, description, category, icon, is_free, sort_order, depends_on)
MODULE_CATALOGUE: list[tuple[str, str, str, str, str, bool, int, list[str]]] = [
    ("core", "Platform Core", "Organization, Business Units, Users, RBAC — always included.",
     PlatformModule.ModuleCategory.CORE, "LayoutDashboard", True, 0, []),

    ("hrms", "HR Management", "Employee records, departments, designations, onboarding.",
     PlatformModule.ModuleCategory.HRMS, "Users", False, 10, []),
    ("attendance", "Time & Attendance", "Shift management, clock-in/out, attendance tracking.",
     PlatformModule.ModuleCategory.HRMS, "Clock", False, 11, ["hrms"]),
    ("leave", "Leave Management", "Leave types, balances, approval workflows.",
     PlatformModule.ModuleCategory.HRMS, "CalendarOff", False, 12, ["hrms"]),
    ("payroll", "Payroll Processing", "Salary runs, payslips, tax/IT declarations, compliance.",
     PlatformModule.ModuleCategory.HRMS, "Wallet", False, 13, ["hrms", "attendance"]),
    ("recruitment", "ATS & Recruitment", "Job postings, candidate pipeline, onboarding handoff.",
     PlatformModule.ModuleCategory.HRMS, "UserPlus", False, 14, ["hrms"]),
    ("appraisal", "Performance Appraisal", "Review cycles, goals, ratings.",
     PlatformModule.ModuleCategory.HRMS, "TrendingUp", False, 15, ["hrms"]),

    ("pos", "Point of Sale", "Retail checkout, terminals, sales transactions.",
     PlatformModule.ModuleCategory.BUSINESS, "ShoppingCart", False, 20, []),
    ("inventory", "Inventory Management", "Stock, SKUs, vendors, batch & expiry tracking.",
     PlatformModule.ModuleCategory.BUSINESS, "Package", False, 21, []),
    ("billing", "Billing", "Invoicing and billing across retail/pharmacy.",
     PlatformModule.ModuleCategory.BUSINESS, "Receipt", False, 22, ["inventory"]),
    ("customers", "Customer Loyalty", "Customer profiles, loyalty points, repeat-purchase tracking.",
     PlatformModule.ModuleCategory.BUSINESS, "Heart", False, 23, ["pos"]),

    ("pharmacy", "Pharmacy Management", "Pharmacy-specific inventory and compliance.",
     PlatformModule.ModuleCategory.BUSINESS, "Pill", False, 30, ["inventory"]),
    ("drug_register", "Drug & Compound Registry", "Controlled-substance register, schedule tracking.",
     PlatformModule.ModuleCategory.BUSINESS, "ClipboardList", False, 31, ["pharmacy"]),
    ("pharmacy_billing", "Pharmacy Point of Sale", "Prescription billing and pharmacy checkout.",
     PlatformModule.ModuleCategory.BUSINESS, "Receipt", False, 32, ["pharmacy", "billing"]),

    ("real_estate", "Real Estate Management", "Property listings, leases, tenant management.",
     PlatformModule.ModuleCategory.BUSINESS, "Building", False, 40, []),

    ("reporting", "Reports & Analytics", "Cross-module dashboards and exportable reports.",
     PlatformModule.ModuleCategory.ANALYTICS, "BarChart3", True, 50, []),
    ("notifications", "Notifications", "Email/SMS/push notification delivery.",
     PlatformModule.ModuleCategory.CORE, "Bell", True, 51, []),
    ("webhooks", "Webhook Integrations", "Outbound webhooks for third-party integrations.",
     PlatformModule.ModuleCategory.INTEGRATIONS, "Webhook", False, 60, []),
]


def run_seed(stdout) -> None:
    """
    Entry point invoked by apps.platform.seed.seed_runner.PlatformSeedRunner.

    Returns nothing — writes progress to `stdout` (a Django command's
    self.stdout, which supports .write()).
    """
    created, updated = 0, 0

    for code, name, description, category, icon, is_free, sort_order, _depends_on in MODULE_CATALOGUE:
        module, was_created = PlatformModule.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "description": description,
                "category": category,
                "icon": icon,
                "is_free": is_free,
                "sort_order": sort_order,
                "is_active": True,
            },
        )
        if was_created:
            created += 1
        else:
            changed = False
            for field, value in (
                ("name", name), ("description", description), ("category", category),
                ("icon", icon), ("is_free", is_free), ("sort_order", sort_order),
            ):
                if getattr(module, field) != value:
                    setattr(module, field, value)
                    changed = True
            if not module.is_active:
                module.is_active = True
                changed = True
            if changed:
                module.save()
                updated += 1

    stdout.write(
        f"  PlatformModule registry: {created} created, {updated} updated, "
        f"{len(MODULE_CATALOGUE)} total in catalogue."
    )


# depends_on is exported separately for module_dependency_validator and
# business_unit_module_view to consume without importing the full tuple list.
MODULE_DEPENDENCIES: dict[str, list[str]] = {
    code: depends_on for code, *_rest, depends_on in MODULE_CATALOGUE
}

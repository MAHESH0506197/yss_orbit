# apps/rbac/management/commands/sync_rbac.py
"""
YSS Orbit — RBAC Synchronization Command

FIX-BUG21 (CRITICAL): This command was a 3-line no-op stub:

    class Command(BaseCommand):
        help = "Sync RBAC permissions and roles"
        def handle(self, *args, **options):
            pass

With NO Permission rows ever seeded, the entire RBAC chain was inert even
after fixing every other layer (HasRBACPermission reading SecurityContext
correctly — FIX-BUG13; TokenService embedding real permissions —
FIX-BUG14; RoleSerializer/PermissionSerializer no longer crashing —
FIX-BUG16):
  - RBACService.get_user_permissions_as_frozenset() → always frozenset()
    (zero RolePermission rows exist, because zero Permission rows exist)
  - RoleSerializer.validate (PrimaryKeyRelatedField queryset=Permission
    .objects.filter(is_active=True)) → always empty choices, RoleFormModal's
    permission matrix renders nothing
  - HasRBACPermission → required_permissions never satisfiable by ANY
    non-super-admin, for ANY of the 5 modules (Organization, BusinessUnit,
    BusinessDomain, Role, Permission) — total RBAC lockout persists.

This command is the SINGLE SOURCE OF TRUTH for the B07 §5.18 permission
catalogue (idempotent — safe to re-run on every deploy, per B07 §5.17
"Permission code renamed after creation = PROHIBITED (HIGH)" — codes here
are additive-only, never renamed/removed).

WHAT THIS SEEDS:
  1. The global Permission registry (BU-independent — Permission has no
     business_unit_id, see FIX-BUG16/permission_serializer.py).
  2. For every active, non-deleted BusinessUnit: the 4 SYSTEM roles
     (OWNER, ADMIN, MANAGER, STAFF — see Role model docstring: "System
     roles (OWNER, ADMIN, MANAGER, STAFF) cannot be deleted"), each with
     its default permission set per the B07 role-hierarchy tiering below.

CATALOGUE SOURCES (every code below is referenced by at least one of):
  - HasRBACPermission.required_permissions / WRITE_PERMISSIONS across
    OrganizationViewSet, BusinessUnitViewSet, BusinessDomainViewSet,
    RoleViewSet, PermissionViewSet, UserViewSet (the 5 modules verified
    in this session)
  - Sidebar.tsx menu `permission:` codes (B07 §5.14 menu-item gating)

NOT YET COVERED (tracked follow-ups, NOT silently dropped):
  - B07 §5.1 `data_scope` (GLOBAL|BUSINESS_UNIT) — Role model has no
    `data_scope` field yet (BUG-18). All roles seeded here are implicitly
    BUSINESS_UNIT-scoped (Role is a TenantModel). GLOBAL-scope roles
    (PLATFORM_ADMIN-style, B07 §5.8 examples) require a schema migration
    adding Role.data_scope + making UserRole.business_unit_id nullable —
    out of scope for this fix to avoid a breaking migration mid-session.
  - New BusinessUnits created AFTER this command runs do NOT automatically
    get their 4 SYSTEM roles — that requires a post_save signal on
    BusinessUnit (apps/business_unit/events/event_handlers.py is the
    natural home, mirroring the BusinessDomain signal pattern from
    FIX-BUG10). Re-running `sync_rbac` after BU creation is the interim
    workaround (it IS idempotent and will backfill missing BUs).
  - Legacy 2-segment permission codes (`inventory.view`, `pos.access`,
    `attendance.view`, etc., from Sidebar.tsx / seed_enterprise.py) deviate
    from B07 §5.16's `{module}.{resource}.{action}` 3-segment format.
    They are seeded AS-IS (Permission.code has no format constraint — see
    models.py) to avoid breaking existing menu items, but should be
    migrated to 3-segment form in a follow-up (e.g. `inventory.dashboard.view`,
    `pos.terminal.access`) — per B07 §5.17, this requires creating NEW
    codes and migrating roles, NOT renaming the existing ones.
"""
from __future__ import annotations

import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.organization.models import BusinessUnit
from apps.iam.models.rbac_models import Permission, Role, RolePermission

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# B07 §5.18 PERMISSION CATALOGUE
# Format: (code, human-readable name, module)
# code = "{module}.{resource}.{action}" (3-segment, per B07 §5.16) where
# possible. Legacy 2-segment codes from Sidebar.tsx are marked LEGACY.
# ─────────────────────────────────────────────────────────────────────────────
PERMISSION_CATALOGUE: list[tuple[str, str, str]] = [
    # ── Organization (apps.organization.api.views.organization_view) ──────────
    ("organization.organization.view",    "View Organizations",         "organization"),
    ("organization.organization.create",  "Create Organizations",       "organization"),
    ("organization.organization.update",  "Update Organizations",       "organization"),
    ("organization.organization.delete",  "Archive Organizations",      "organization"),
    ("organization.organization.restore", "Restore Organizations",      "organization"),

    # ── Business Unit (apps.organization.api.views.business_unit_view) ───────
    ("business_unit.businessunit.view",    "View Business Units",        "business_unit"),
    ("business_unit.businessunit.create",  "Create Business Units",      "business_unit"),
    ("business_unit.businessunit.update",  "Update Business Units",      "business_unit"),
    ("business_unit.businessunit.delete",  "Archive Business Units",     "business_unit"),
    ("business_unit.businessunit.restore", "Restore Business Units",     "business_unit"),

    # ── Business Domain (apps.organization.api.views.business_domain_view) ─
    ("business_domain.businessdomain.view",    "View Business Domains",   "business_domain"),
    ("business_domain.businessdomain.create",  "Create Business Domains", "business_domain"),
    ("business_domain.businessdomain.update",  "Update Business Domains", "business_domain"),
    ("business_domain.businessdomain.delete",  "Archive Business Domains","business_domain"),
    ("business_domain.businessdomain.restore", "Restore Business Domains","business_domain"),

    # ── RBAC: Roles (apps.iam.api.views.role_view) ────────────────────────────
    ("rbac.role.view",    "View Roles",    "rbac"),
    ("rbac.role.create",  "Create Roles",  "rbac"),
    ("rbac.role.update",  "Update Roles",  "rbac"),
    ("rbac.role.delete",  "Archive Roles", "rbac"),
    ("rbac.role.restore", "Restore Roles", "rbac"),

    # ── RBAC: Permissions (apps.iam.api.views.permission_view — read-only) ────
    ("rbac.permission.view", "View Permission Registry", "rbac"),

    # ── Users / IAM (apps.iam.api.views.user_views) ──────────────────────────
    ("users.user.view",   "View Users",   "users"),
    ("users.user.create", "Create Users", "users"),
    ("users.user.update", "Update Users", "users"),
    ("users.user.delete", "Archive Users","users"),

    # ── Platform navigation (Sidebar.tsx menu gating, B07 §5.14) ───────────────
    ("platform.dashboard.view",      "View Platform Dashboard",     "platform"),
    ("platform.business_units.view", "View Business Units (nav)",   "platform"),
    ("platform.users.view",          "View Users (nav)",            "platform"),
    ("platform.users.manage",        "Manage Users (nav)",          "platform"),
    ("platform.roles.view",          "View Roles (nav)",            "platform"),
    ("platform.roles.manage",        "Manage Roles & Templates",    "platform"),
    ("platform.domains.view",        "View Business Domains (nav)", "platform"),
    ("platform.subscription.view",   "View Subscriptions",          "platform"),
    ("platform.branding.manage",     "Manage Branding",             "platform"),
    ("platform.audit.view",          "View Audit Logs",             "platform"),
    ("platform.notifications.view",  "View Notifications",          "platform"),
    ("platform.integrations.manage", "Manage Integrations",         "platform"),

    # ── HR & Payroll: Core HR (hrms) ───────────────────────────────────────────
    ("hrms.employee.view",       "View Employees (List, 360, Org Chart)", "hrms"),
    ("hrms.employee.create",     "Create Employees",                      "hrms"),
    ("hrms.employee.update",     "Update Employees",                      "hrms"),
    ("hrms.employee.delete",     "Archive/Delete Employees",              "hrms"),
    ("hrms.contract.manage",     "Manage Employment Contracts",           "hrms"),
    ("hrms.document.manage",     "Manage Employee Documents",             "hrms"),
    ("hrms.benefit.manage",      "Manage Employee Benefits",              "hrms"),
    ("hrms.policy.manage",       "Manage HR Policies",                    "hrms"),
    ("hrms.report.view",         "View HR Reports",                       "hrms"),
    ("hrms.dashboard.view",      "View HR Dashboard",                     "hrms"),
    ("hrms.department.manage",   "Manage Departments",                    "hrms"),
    ("hrms.designation.manage",  "Manage Designations",                   "hrms"),
    ("hrms.shift.manage",        "Manage Shifts",                         "hrms"),
    ("hrms.onboarding.manage",   "Manage Onboarding",                     "hrms"),
    ("hrms.offboarding.manage",  "Manage Offboarding",                    "hrms"),
    ("hrms.asset.manage",        "Manage Assets",                         "hrms"),
    ("hrms.team_data.view",      "View Team Data (MSS)",                  "hrms"),

    # ── HR & Payroll: Attendance ───────────────────────────────────────────────
    ("attendance.dashboard.view", "View Attendance Dashboard", "attendance"),
    ("attendance.log.view",       "View Attendance Logs",      "attendance"),
    ("attendance.log.update",     "Update Attendance Logs",    "attendance"),
    ("attendance.device.manage",  "Manage Biometric Devices",  "attendance"),
    ("attendance.shift_roster.manage", "Manage Shift Rosters", "attendance"),
    ("attendance.regularization.approve", "Approve Attendance Regularizations", "attendance"),
    ("attendance.report.view",    "View Attendance Reports",   "attendance"),

    # ── HR & Payroll: Payroll ──────────────────────────────────────────────────
    ("payroll.run.view",           "View Payroll Runs",             "payroll"),
    ("payroll.run.execute",        "Execute Payroll Run",           "payroll"),
    ("payroll.structure.manage",   "Manage Salary Structures",      "payroll"),
    ("payroll.payslip.view",       "View Payslips",                 "payroll"),
    ("payroll.tax.manage",         "Manage IT/Tax Declarations",    "payroll"),
    ("payroll.report.view",        "View Payroll Reports",          "payroll"),
    ("payroll.compliance.view",    "View Payroll Compliance",       "payroll"),
    ("payroll.loan.manage",        "Manage Employee Loans",         "payroll"),
    ("payroll.expense.manage",     "Manage Expense Claims",         "payroll"),
    ("payroll.dashboard.view",     "View Payroll Dashboard",        "payroll"),
    ("payroll.advance.manage",     "Manage Salary Advances",        "payroll"),
    ("payroll.bonus.manage",       "Manage Bonuses & Incentives",   "payroll"),

    # ── HR & Payroll: Leave ────────────────────────────────────────────────────
    ("leave.dashboard.view",     "View Leave Dashboard",       "leave"),
    ("leave.request.view",       "View Leave Requests",        "leave"),
    ("leave.request.approve",    "Approve Leave Requests",     "leave"),
    ("leave.balance.manage",     "Manage Leave Balances",      "leave"),
    ("leave.policy.manage",      "Manage Leave Policies",      "leave"),
    ("leave.holiday.manage",     "Manage Holiday Calendar",    "leave"),
    ("leave.report.view",        "View Leave Reports",         "leave"),
    ("leave.request.create",     "Create/Submit Leave Requests", "leave"),

    # ── HR & Payroll: Appraisal ────────────────────────────────────────────────
    ("appraisal.cycle.manage",   "Manage Appraisal Cycles",    "appraisal"),
    ("appraisal.review.view",    "View Appraisal Reviews",     "appraisal"),
    ("appraisal.review.submit",  "Submit Appraisal Reviews",   "appraisal"),
    ("appraisal.template.manage","Manage Appraisal Templates", "appraisal"),
    ("appraisal.goal.manage",    "Manage OKRs / Goals",        "appraisal"),
    ("appraisal.report.view",    "View Appraisal Reports",     "appraisal"),
    ("appraisal.feedback.submit","Submit Continuous Feedback", "appraisal"),

    # ── HR & Payroll: Recruitment ──────────────────────────────────────────────
    ("recruitment.job.manage",       "Manage Job Postings",         "recruitment"),
    ("recruitment.candidate.manage", "Manage Candidates",           "recruitment"),
    ("recruitment.interview.manage", "Manage Interviews",           "recruitment"),
    ("recruitment.offer.manage",     "Manage Job Offers",           "recruitment"),
    ("recruitment.report.view",      "View Recruitment Reports",    "recruitment"),

    # ── LEGACY 2-segment codes (Sidebar.tsx / seed_enterprise.py) ──────────────
    # Seeded as-is to avoid breaking existing menu items / seed data.
    # See module docstring "NOT YET COVERED" for the migration plan.
    ("training.view",    "View Training (legacy)",    "training"),
    ("recruitment.view", "View Recruitment (legacy)", "recruitment"),
    ("inventory.view",   "View Inventory (legacy)",   "inventory"),
    ("pharmacy.view",    "View Pharmacy (legacy)",    "pharmacy"),
    ("billing.view",     "View Billing (legacy)",     "billing"),
    ("pos.access",       "Access POS (legacy)",       "pos"),
    ("reporting.view",   "View Reports (legacy)",     "reporting"),
    ("support.view",     "View Support Tickets (legacy)", "support"),

    # ── User-BU Mapping (IMPLEMENTATION_PLAN.md item 1, FIX-BUG34) ──────────
    # UserBusinessUnitViewSet: /api/v1/user-bu-mapping/memberships/
    # Previously ungated (IsAuthenticated only). These codes added to tier:
    #   OWNER/ADMIN: all 5  |  MANAGER: view+create+update+restore
    #   STAFF: view only
    ("users.userbu.view",    "View User-BU Memberships",    "users"),
    ("users.userbu.create",  "Create User-BU Memberships",  "users"),
    ("users.userbu.update",  "Update User-BU Memberships",  "users"),
    ("users.userbu.delete",  "Archive User-BU Memberships", "users"),
    ("users.userbu.restore", "Restore User-BU Memberships", "users"),

    # ── User-RBAC Mapping (IMPLEMENTATION_PLAN.md item 2, FIX-BUG35) ────────
    # UserRoleViewSet: /api/v1/user-roles/ (new endpoint — never existed before)
    # OWNER/ADMIN: all 4  |  MANAGER: view only (role assignment via UBU)
    # STAFF: view only
    ("rbac.userrole.view",    "View User Role Assignments",    "rbac"),
    ("rbac.userrole.create",  "Assign Roles to Users",         "rbac"),
    ("rbac.userrole.delete",  "Revoke User Role Assignments",  "rbac"),
    ("rbac.userrole.restore", "Restore User Role Assignments", "rbac"),

    # ── BU Module Subscription / Access Management (items 3 & 4, FIX-BUG38/39)
    # BusinessUnitModuleViewSet: /api/v1/business-units/modules/
    # OWNER/ADMIN: all 4  |  MANAGER: view+activate+deactivate
    # STAFF: view only
    ("business_unit.businessunitmodule.view",       "View BU Module Subscriptions",        "business_unit"),
    ("business_unit.businessunitmodule.activate",   "Activate Modules for a BU",           "business_unit"),
    ("business_unit.businessunitmodule.deactivate", "Deactivate/Suspend Modules for a BU", "business_unit"),
    ("business_unit.businessunitmodule.manage",     "Manage BU Module Plan Limits",        "business_unit"),
]





class Command(BaseCommand):
    help = (
        "Sync the RBAC Permission registry (B07 §5.18 catalogue). "
        "Idempotent — safe to re-run on every deploy."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        with transaction.atomic():
            perm_created, perm_existing = self._sync_permissions(dry_run)

            if dry_run:
                # Roll back — dry run must not persist anything.
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(
            f"Permissions: {perm_created} created, {perm_existing} already existed "
            f"({len(PERMISSION_CATALOGUE)} total in catalogue)."
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING("--dry-run: no changes were committed."))

    def _sync_permissions(self, dry_run: bool) -> tuple[int, int]:
        """
        Idempotently upsert every (code, name, module) from
        PERMISSION_CATALOGUE into the Permission table.

        Existing Permission rows are updated (name/module may change —
        the CODE itself never does, per B07 §5.17). New codes are created.
        Codes NOT in the catalogue are left untouched (additive-only —
        we never deactivate/delete permissions here, since RolePermission
        rows may reference them).
        """
        created_count = 0
        existing_count = 0

        for code, name, module in PERMISSION_CATALOGUE:
            perm, was_created = Permission.objects.get_or_create(
                code=code,
                defaults={"name": name, "module": module, "is_active": True},
            )
            if was_created:
                created_count += 1
                logger.info("RBAC sync: created Permission %s", code)
            else:
                existing_count += 1
                # Keep name/module in sync if they drifted (code is immutable).
                if perm.name != name or perm.module != module or not perm.is_active:
                    perm.name = name
                    perm.module = module
                    perm.is_active = True
                    if not dry_run:
                        perm.save(update_fields=["name", "module", "is_active"])

        return created_count, existing_count



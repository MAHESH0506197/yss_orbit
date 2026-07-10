import uuid
import random
from datetime import timedelta
from django.utils import timezone
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from faker import Faker

# Core
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.tenancy.models.domain_model import Domain
from apps.platform.models.brand_configuration import BrandConfiguration
from apps.tenancy.models import SubscriptionPlan
from apps.tenancy.models import TenantModule, ModuleStatus
from apps.organization.models import BusinessUnitModule
from apps.iam.models.user import User
from apps.iam.models.rbac_models import Role, Permission, RolePermission, UserRole
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel

# Modules
from apps.hrms.models import Department, Employee
from apps.inventory.models import Item, Category, Vendor

class Command(BaseCommand):
    help = "Massively seed the database with realistic enterprise data for all modules."

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.faker = Faker()

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Wiping existing data for fresh seed..."))
        # We don't delete everything, we just rely on get_or_create to populate missing bits,
        # but we can create new randomized entities.

        self.stdout.write("Starting Enterprise Seed...")

        # 1. Platform Organization & Super Admin
        platform_org, _ = Organization.objects.get_or_create(
            slug="yss-orbit-platform",
            defaults={"name": "YSS Orbit Platform"}
        )

        super_admin = User.objects.filter(email="superadmin@yssorbit.com").first()
        if not super_admin:
            super_admin = User.objects.create_superuser(
                username="SuperAdmin@1!",
                email="superadmin@yssorbit.com",
                password="Admin123!",
                first_name="Super",
                last_name="Admin"
            )
            self.stdout.write(self.style.SUCCESS("Created Super Admin user: superadmin@yssorbit.com / Admin123!"))

        # Subscription Plan
        enterprise_plan, _ = SubscriptionPlan.objects.get_or_create(
            code="ENTERPRISE",
            defaults={"name": "Enterprise Complete Plan", "price": 4999.00}
        )

        # Base Modules to subscribe
        modules_to_subscribe = [
            "hrms", "attendance", "leave", "payroll", "recruitment", "appraisal", "compliance",
            "inventory", "batch_tracking", "stock_transfer", "vendor_management", "pharmacy",
            "drug_register", "expiry_tracking", "pos", "billing", "retail_billing", "pharmacy_billing",
            "customers", "reporting", "support", "events", "notification", "branding",
            "error_log", "integration", "feature_flags", "jobs", "domain", "subscription", "module_registry"
        ]

        # FIX-BUG24/25: Run sync_rbac FIRST. This seeds the canonical Permission
        # catalogue (B07 §5.18 — the SAME codes HasRBACPermission actually
        # checks across Organization/BusinessUnit/BusinessDomain/Role/Permission)
        # and the 4 SYSTEM roles (OWNER/ADMIN/MANAGER/STAFF) for every existing
        # BusinessUnit. At this point in the command no client BUs exist yet —
        # sync_rbac will simply seed zero BU-roles on this pass for the
        # platform_org's BU (none created yet either) and the full set once
        # client BUs are created below. Re-running `python manage.py sync_rbac`
        # afterward (or re-running this seed command) backfills BU roles for
        # any BU created after this initial call.
        self.stdout.write("Syncing RBAC permission catalogue and SYSTEM roles...")
        call_command("sync_rbac")

        # Resolve a curated set of REAL catalogue codes for the demo
        # "System Admin" / "Manager" custom roles created below. These are
        # ADDITIVE custom roles alongside the SYSTEM OWNER/ADMIN/MANAGER/
        # STAFF roles sync_rbac creates on each BU once it is re-run after
        # the BUs below exist.
        admin_demo_codes = [
            "organization.organization.view",
            "organization.organization.update",
            "business_unit.businessunit.view",
            "business_unit.businessunit.create",
            "business_unit.businessunit.update",
            "business_domain.businessdomain.view",
            "rbac.role.view",
            "rbac.role.create",
            "rbac.role.update",
            "rbac.permission.view",
            "users.user.view",
            "users.user.create",
            "users.user.update",
            "platform.business_units.view",
            "platform.users.view",
            "platform.users.manage",
            "platform.roles.view",
            "platform.domains.view",
            "platform.branding.manage",
            "hrms.employees.view",
            "hrms.employees.create",
            "hrms.employees.edit",
            "inventory.view",
            "reporting.view",
        ]
        manager_demo_codes = [
            c for c in admin_demo_codes
            if c.endswith(".view") or c == "pos.access"
        ]

        # FIX-BUG24/25: Replaces the old `base_permissions` list + get_or_create
        # loop. Those codes (e.g. "platform.roles.manage", "inventory.manage")
        # were a SEPARATE, partially-overlapping catalogue from B07 §5.18 /
        # sync_rbac's PERMISSION_CATALOGUE — a "System Admin" role built from
        # them could browse the demo UI's nav menu but would 403 on
        # /api/v1/organizations/, /api/v1/business-units/,
        # /api/v1/business-domains/, /api/v1/roles/ (the exact codes
        # HasRBACPermission checks for the 5 verified modules). Permission rows
        # for ALL of these codes already exist after sync_rbac (above) — we
        # just resolve the subset relevant to the demo roles.
        perms_objs = list(
            Permission.objects.filter(code__in=admin_demo_codes, is_active=True)
        )
        manager_perms_objs = list(
            Permission.objects.filter(code__in=manager_demo_codes, is_active=True)
        )

        # 2. Create Enterprise Clients
        clients = [
            {"name": "Acme Global", "slug": "acme-global", "domain": "acme.yssorbit.local"},
            {"name": "Paynex Corp", "slug": "paynex-corp", "domain": "paynex.yssorbit.local"},
        ]

        for client_data in clients:
            org, _ = Organization.objects.get_or_create(slug=client_data["slug"], defaults={"name": client_data["name"]})

            # Create HQ Business Unit
            bu, _ = BusinessUnit.objects.get_or_create(
                organization=org,
                code=f"{client_data['slug'].upper()}-HQ",
                defaults={"name": f"{client_data['name']} HQ", "is_main_branch": True}
            )

            # Domain
            Domain.objects.get_or_create(
                name=client_data["domain"],
                defaults={"business_unit_id": bu.id, "is_primary": True, "is_verified": True}
            )

            # Branding
            BrandConfiguration.objects.get_or_create(
                organization=org,
                business_unit=bu,
                defaults={
                    "branding_mode": "co_brand",
                    "company_name": client_data["name"],
                    "primary_color": self.faker.hex_color(),
                }
            )

            # Subscriptions (legacy TenantModule — kept for backward compat
            # with any code that still reads tenant_modules table).
            for mod in modules_to_subscribe:
                TenantModule.objects.get_or_create(
                    business_unit_id=bu.id,
                    module_code=mod,
                    defaults={"plan": enterprise_plan, "status": getattr(ModuleStatus, 'ACTIVE', "ACTIVE")}
                )

            # FIX-BUG39 (CRITICAL): Also activate BusinessUnitModule rows —
            # the table ModuleSubscriptionMiddleware._check_module_access()
            # ACTUALLY reads (business_unit_module, not tenant_modules).
            # Without this, the middleware returns 403 module_not_subscribed
            # for ALL 14 _MODULE_PATH_MAP-gated prefixes (hrms, payroll, pos,
            # inventory, billing, customers, pharmacy, reporting, etc.) for
            # every demo user on every request, even though the TenantModule
            # rows above were correctly seeded. Both tables are now populated.
            # Dependency order: free/core modules first, then dependents.
            from apps.tenancy.models import PlatformModule
            from django.utils import timezone as tz

            # Activation order respects MODULE_DEPENDENCIES (depends_on must
            # be active before dependents). Groups by tier:
            #   Tier 0: no dependencies (always safe to activate)
            #   Tier 1: depends only on tier-0 modules
            #   Tier 2: depends on tier-0 OR tier-1 modules
            activation_order = [
                # Tier 0 — no dependencies
                "core", "pos", "inventory", "real_estate",
                "reporting", "notifications", "webhooks",
                "hrms",
                # Tier 1 — depends on tier-0
                "attendance", "leave", "recruitment", "appraisal",
                "billing", "customers", "pharmacy",
                # Tier 2 — depends on tier-1
                "payroll", "drug_register", "pharmacy_billing",
            ]
            for module_code in activation_order:
                try:
                    platform_module = PlatformModule.objects.get(code=module_code, is_active=True)
                    BusinessUnitModule.objects.get_or_create(
                        business_unit_id=bu.id,
                        module=platform_module,
                        defaults={
                            "status": BusinessUnitModule.Status.ACTIVE,
                            "activated_at": tz.now(),
                        }
                    )
                except PlatformModule.DoesNotExist:
                    # PlatformModule registry not yet seeded — safe to skip.
                    # Re-run `python manage.py seed_enterprise` after
                    # `python manage.py seed_all` to backfill these rows.
                    pass

            # FIX-BUG24 (CRITICAL): bulk_create RolePermission rows directly.
            # Django UNCONDITIONALLY disallows .add()/.remove()/.set() on M2M
            # fields with a custom `through` model — Role.permissions has
            # through="RolePermission". The previous
            #     admin_role.permissions.add(*perms_objs)
            # raised AttributeError on every run, crashing this ENTIRE command
            # before any of the org/BU/user/HR/inventory seed data below
            # executed. get_or_create-then-bulk_create(ignore_conflicts=True)
            # is the idempotent equivalent of .add() for through-M2M relations
            # — RolePermission has unique_together=[("role","permission")], so
            # ignore_conflicts=True makes re-running this command safe.
            admin_role, _ = Role.objects.get_or_create(business_unit_id=bu.id, name="System Admin", defaults={"role_type": "CUSTOM"})
            RolePermission.objects.bulk_create(
                [RolePermission(role=admin_role, permission=p) for p in perms_objs],
                ignore_conflicts=True,
            )

            manager_role, _ = Role.objects.get_or_create(business_unit_id=bu.id, name="Manager", defaults={"role_type": "CUSTOM"})
            RolePermission.objects.bulk_create(
                [RolePermission(role=manager_role, permission=p) for p in manager_perms_objs],
                ignore_conflicts=True,
            )

            # Admin User
            prefix = client_data["slug"].split("-")[0]
            admin_email = f"admin@{prefix}.com"
            admin_user = User.objects.filter(email=admin_email).first()
            if not admin_user:
                admin_user = User.objects.create_user(
                    username=f"{prefix.capitalize()}Admin@1!",
                    email=admin_email,
                    password="Password123!",
                    first_name=self.faker.first_name(),
                    last_name=self.faker.last_name(),
                    is_active=True,
                    is_email_verified=True
                )
                self.stdout.write(self.style.SUCCESS(f"Created Admin: {admin_email} / Password123!"))

            UserBusinessUnitModel.objects.get_or_create(
                user=admin_user, business_unit=bu, defaults={"role": admin_role, "is_active_membership": True}
            )
            UserRole.objects.get_or_create(user_id=admin_user.id, business_unit_id=bu.id, role=admin_role, defaults={"is_active": True})

            # HR Data Generation
            self.stdout.write(f"Generating HR data for {client_data['name']}...")
            departments = []
            for dname in ["Engineering", "Sales", "HR", "Operations", "Finance"]:
                dept, _ = Department.objects.get_or_create(business_unit_id=bu.id, name=dname, defaults={"code": dname[:3].upper()})
                departments.append(dept)

            for _ in range(15):
                emp_user = User.objects.create_user(
                    username=self.faker.user_name() + "@1!",
                    email=self.faker.unique.email(),
                    password="Password123!",
                    first_name=self.faker.first_name(),
                    last_name=self.faker.last_name(),
                    is_active=True,
                    is_email_verified=True
                )
                UserBusinessUnitModel.objects.get_or_create(
                    user=emp_user, business_unit=bu, defaults={"role": manager_role, "is_active_membership": True}
                )
                Employee.objects.get_or_create(
                    business_unit_id=bu.id,
                    user_id=emp_user.id,
                    defaults={
                        "employee_code": self.faker.unique.bothify(text='EMP-####'),
                        "department": random.choice(departments),
                        "date_of_joining": self.faker.date_between(start_date='-5y', end_date='today'),
                        "employment_status": "ACTIVE",
                        "first_name": emp_user.first_name,
                        "last_name": emp_user.last_name,
                    }
                )

            # Inventory Data Generation
            self.stdout.write(f"Generating Inventory data for {client_data['name']}...")
            cat, _ = Category.objects.get_or_create(business_unit_id=bu.id, name="Electronics", defaults={"description": "Electronics"})
            cat2, _ = Category.objects.get_or_create(business_unit_id=bu.id, name="Office Supplies", defaults={"description": "Office Supplies"})

            ven, _ = Vendor.objects.get_or_create(business_unit_id=bu.id, name="Main Supplier", defaults={"email": "supplier@example.com"})

            for _ in range(20):
                Item.objects.get_or_create(
                    business_unit_id=bu.id,
                    sku=self.faker.unique.bothify(text='SKU-####-???'),
                    defaults={
                        "name": self.faker.word().capitalize() + " " + self.faker.word().capitalize(),
                        "category": random.choice([cat, cat2]),
                        "unit": "PCS",
                    }
                )

        # FIX-BUG24/25 (cont.): Re-run sync_rbac now that client BUs exist —
        # this backfills the 4 SYSTEM roles (OWNER/ADMIN/MANAGER/STAFF) onto
        # the Acme/Paynex HQ BUs created above. Idempotent: BUs that already
        # had these roles from a prior run are left untouched (sync_rbac uses
        # get_or_create + permission-set diffing, not destructive recreation).
        self.stdout.write("Re-syncing RBAC SYSTEM roles for newly created Business Units...")
        call_command("sync_rbac")

        self.stdout.write(self.style.SUCCESS("Successfully seeded enterprise data!"))
        self.stdout.write(self.style.SUCCESS("\nLogin credentials available:"))
        self.stdout.write("- Super Admin: superadmin@yssorbit.com / Admin123!")
        self.stdout.write("- Acme Admin: admin@acme.com / Password123!")
        self.stdout.write("- Paynex Admin: admin@paynex.com / Password123!")

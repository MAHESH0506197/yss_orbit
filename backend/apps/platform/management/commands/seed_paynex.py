import uuid
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.tenancy.models.domain_model import Domain
from apps.platform.models.brand_configuration import BrandConfiguration
from apps.tenancy.models import SubscriptionPlan
from apps.tenancy.models import TenantModule, ModuleStatus
from apps.iam.models.user import User
from apps.iam.models.rbac_models import Role, Permission, UserRole
from apps.organization.models.user_business_unit_model import UserBusinessUnitModel

class Command(BaseCommand):
    help = "Seed the database for the Paynex enterprise client."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting Paynex seed...")

        # 1. Platform Organization & Super Admin
        platform_org, created = Organization.objects.get_or_create(
            slug="yss-orbit-platform",
            defaults={"name": "YSS Orbit Platform"}
        )
        if created:
            self.stdout.write("Created Platform Organization.")
        else:
            self.stdout.write("Platform Organization already exists.")

        super_admin = User.objects.filter(email="superadmin@yssorbit.com").first()
        if not super_admin:
            super_admin = User.objects.create_superuser(
                username="SuperAdmin@1!",
                email="superadmin@yssorbit.com",
                password="Admin123!",
                first_name="Super",
                last_name="Admin"
            )
            self.stdout.write("Created Super Admin user.")
        else:
            self.stdout.write("Super Admin already exists.")

        # 2. Client Organization (Paynex)
        paynex_org, created = Organization.objects.get_or_create(
            slug="paynex",
            defaults={"name": "Paynex"}
        )
        if created:
            self.stdout.write("Created Paynex Organization.")

        # 3. BusinessUnit for Paynex
        paynex_bu, created = BusinessUnit.objects.get_or_create(
            organization=paynex_org,
            code="PAYNEX-HQ",
            defaults={
                "name": "Paynex HQ",
                "is_main_branch": True,
            }
        )
        if created:
            self.stdout.write("Created Paynex HQ Business Unit.")

        # 4. Domain
        domain, created = Domain.objects.get_or_create(
            name="paynex.yssorbit.local",
            defaults={
                "business_unit_id": paynex_bu.id,
                "is_primary": True,
                "is_verified": True
            }
        )
        if created:
            self.stdout.write("Created domain paynex.yssorbit.local.")

        # 5. BrandConfiguration
        brand_config, created = BrandConfiguration.objects.get_or_create(
            business_unit_id=paynex_bu.id,
            defaults={
                "mode": "co_brand",
                "company_name": "Paynex",
                "logo_url": "/assets/brands/paynex-logo.png",
                "primary_color": "#6CC24A",
            }
        )
        if created:
            self.stdout.write("Created BrandConfiguration for Paynex.")

        # 6. Subscription allowing 'hrms' module for Paynex BU
        plan, _ = SubscriptionPlan.objects.get_or_create(
            code="ENTERPRISE",
            defaults={
                "name": "Enterprise Plan",
                "price": 999.00
            }
        )
        tenant_module, created = TenantModule.objects.get_or_create(
            business_unit_id=paynex_bu.id,
            module_code="hrms",
            defaults={
                "plan": plan,
                "status": getattr(ModuleStatus, 'ACTIVE', "ACTIVE"),
            }
        )
        if created:
            self.stdout.write("Created HRMS TenantModule subscription for Paynex BU.")

        # 7. HR Admin Role and permissions
        hr_permissions_data = [
            ("hrms.employees.view", "View Employees", "hrms"),
            ("hrms.employees.create", "Create Employees", "hrms"),
            ("hrms.employees.edit", "Edit Employees", "hrms"),
            ("hrms.employees.delete", "Delete Employees", "hrms"),
            ("hrms.settings.manage", "Manage HR Settings", "hrms"),
        ]
        hr_perms = []
        for code, name, module in hr_permissions_data:
            perm, _ = Permission.objects.get_or_create(
                code=code,
                defaults={"name": name, "module": module}
            )
            hr_perms.append(perm)

        hr_admin_role, created = Role.objects.get_or_create(
            business_unit_id=paynex_bu.id,
            name="HR Admin",
            defaults={
                "description": "HR Administrator",
                "role_type": "CUSTOM"
            }
        )
        hr_admin_role.permissions.add(*hr_perms)
        if created:
            self.stdout.write("Created HR Admin role and assigned HR permissions.")

        # 8. Paynex User
        hr_admin_user = User.objects.filter(email="hradmin@paynex.com").first()
        if not hr_admin_user:
            hr_admin_user = User.objects.create_user(
                username="HrAdmin@1!",
                email="hradmin@paynex.com",
                password="Paynex123!",
                first_name="HR",
                last_name="Admin",
                is_active=True,
                is_email_verified=True
            )
            self.stdout.write("Created hradmin user.")

        # Assign to BU
        ubu, created = UserBusinessUnitModel.objects.get_or_create(
            user=hr_admin_user,
            business_unit=paynex_bu,
            defaults={
                "role": hr_admin_role,
                "is_active_membership": True
            }
        )
        if created:
            self.stdout.write("Assigned hradmin to Paynex BU via UserBusinessUnitModel.")

        # Also create UserRole for RBAC system
        user_role, created = UserRole.objects.get_or_create(
            user_id=hr_admin_user.id,
            business_unit_id=paynex_bu.id,
            role=hr_admin_role,
            defaults={
                "is_active": True
            }
        )
        if created:
            self.stdout.write("Assigned HR Admin role to hradmin user via UserRole.")

        self.stdout.write(self.style.SUCCESS("Successfully seeded Paynex database."))

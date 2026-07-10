# yss_orbit\backend\seed_data.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.organization.models.organization_model import Organization
from apps.organization.models.business_unit_model import BusinessUnit
from apps.iam.models.rbac_models import Role, UserRole, Permission
from django.apps import apps

UserBusinessUnit = apps.get_model('users', 'UserBusinessUnit')
User = get_user_model()

try:
    # 1. Create or Get Admin
    if not User.objects.filter(username="admin").exists():
        admin_user = User.objects.create_superuser("admin", "admin@example.com", "admin")
        print("Created admin user.")
    else:
        admin_user = User.objects.get(username="admin")

    # 2. Create Organization
    org, created = Organization.objects.get_or_create(
        name="YSS Orbit Demo",
        defaults={
            "slug": "yss-orbit-demo",
            "domain": "demo.yssorbit.com"
        }
    )

    # 3. Create BU
    bu, created = BusinessUnit.objects.get_or_create(
        name="Headquarters",
        defaults={}
    )

    # 4. Create System Roles
    admin_role, created = Role.objects.get_or_create(
        business_unit_id=bu.id,
        name="ADMIN",
        defaults={
            "description": "System Administrator",
            "role_type": "SYSTEM"
        }
    )
    user_role, created = Role.objects.get_or_create(
        business_unit_id=bu.id,
        name="USER",
        defaults={
            "description": "General User",
            "role_type": "SYSTEM",
            "is_default": True
        }
    )

    # 5. Assign User to BU
    ubu, created = UserBusinessUnit.objects.get_or_create(
        user=admin_user,
        business_unit_id=bu.id,
        defaults={
            "role_id": admin_role.id,
            "is_active": True
        }
    )

    # 6. Assign UserRole in RBAC module
    ur, created = UserRole.objects.get_or_create(
        user_id=admin_user.id,
        business_unit_id=bu.id,
        role=admin_role,
        defaults={
            "is_active": True
        }
    )

    print("✅ Data Seeding Completed!")
    print(f"Organization: {org.name}")
    print(f"Business Unit: {bu.name}")
    print(f"UserBusinessUnit linked: {ubu.user.username} -> {bu.name}")

except Exception as e:
    print(f"❌ Error during seeding: {str(e)}")

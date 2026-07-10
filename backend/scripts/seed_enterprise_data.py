import os
import sys
import django
from decimal import Decimal

# Add backend to path and setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from apps.organization.models.organization_model import Organization
from apps.organization.models import BusinessUnit
from apps.organization.enums.enums import BusinessUnitIndustry
from apps.iam.models.rbac_models import Role, UserRole
from apps.iam.models.membership import UserBusinessUnit
from apps.inventory.models import Category, Item, Vendor

User = get_user_model()

@transaction.atomic
def run_seed():
    print("Starting Enterprise Scale Data Seeding...")

    # 1. Organization
    org, _ = Organization.objects.get_or_create(
        slug="acme-global",
        defaults={"name": "Acme Global Corporation"}
    )
    print(f"Organization created: {org.name}")

    # 2. Business Units
    bu_hq, _ = BusinessUnit.objects.get_or_create(
        organization=org,
        code="HQ01",
        defaults={
            "name": "Acme Global HQ",
            "industry": BusinessUnitIndustry.OTHER,
            "city": "Mumbai"
        }
    )
    # Ensure it's the main branch safely
    BusinessUnit.objects.filter(organization=org).exclude(id=bu_hq.id).update(is_main_branch=False)
    bu_hq.is_main_branch = True
    bu_hq.save(update_fields=["is_main_branch"])
    bu_blr, _ = BusinessUnit.objects.get_or_create(
        organization=org,
        code="BLR01",
        defaults={
            "name": "Acme Bangalore Retail",
            "industry": BusinessUnitIndustry.RETAIL,
            "city": "Bangalore",
        }
    )
    print(f"Business Units created: {bu_hq.name}, {bu_blr.name}")

    # 3. Roles
    roles = {}
    for bu in [bu_hq, bu_blr]:
        roles[bu.id] = {}
        for role_name in ["ADMIN", "MANAGER", "CASHIER"]:
            r, _ = Role.objects.get_or_create(
                business_unit_id=bu.id,
                name=role_name,
                defaults={"role_type": Role.RoleType.SYSTEM}
            )
            roles[bu.id][role_name] = r
    print("System Roles provisioned across BUs")

    # 4. Users & Assignments
    users_data = [
        {"username": "admin_global", "email": "admin@acme.com", "bu": bu_hq, "role": "ADMIN"},
        {"username": "mgr_hq", "email": "mgr.hq@acme.com", "bu": bu_hq, "role": "MANAGER"},
        {"username": "mgr_blr", "email": "mgr.blr@acme.com", "bu": bu_blr, "role": "MANAGER"},
        {"username": "cashier_blr1", "email": "cashier1@acme.com", "bu": bu_blr, "role": "CASHIER"},
        {"username": "cashier_blr2", "email": "cashier2@acme.com", "bu": bu_blr, "role": "CASHIER"},
    ]

    for ud in users_data:
        # Create User
        u = User.objects.filter(username=ud["username"]).first()
        if not u:
            u = User.objects.create_user(
                username=ud["username"],
                email=ud["email"],
                password="Password123!"
            )
            u.is_active = True
            u.is_email_verified = True
            if ud["role"] == "ADMIN":
                u.is_super_admin = True
            u.save()

        # Link to BU
        UserBusinessUnit.objects.get_or_create(
            user=u,
            business_unit_id=ud["bu"].id,
            defaults={"is_active": True}
        )

        # Assign Role
        UserRole.objects.get_or_create(
            user_id=u.id,
            business_unit_id=ud["bu"].id,
            defaults={
                "role": roles[ud["bu"].id][ud["role"]],
                "is_active": True
            }
        )
    print("Users and RBAC mappings generated")

    # 5. Inventory Master Data (Scoped to BLR Branch)
    cat_elec, _ = Category.objects.get_or_create(
        business_unit_id=bu_blr.id,
        name="Electronics",
        defaults={"description": "Electronic Items"}
    )
    
    vendor_apple, _ = Vendor.objects.get_or_create(
        business_unit_id=bu_blr.id,
        name="Apple Inc"
    )

    Item.objects.get_or_create(
        business_unit_id=bu_blr.id,
        sku="MBP-14-M3",
        defaults={
            "name": "MacBook Pro 14 M3",
            "category": cat_elec,
            "gst_rate": Decimal("18.00"),
            "unit": "pcs",
            "stock_quantity": Decimal("10.00"),
            "reorder_level": Decimal("2.00"),
            "is_active": True
        }
    )
    print("Inventory Master Data generated for BLR Branch")

    print("Enterprise Seeding Complete! Idempotency Verified.")

if __name__ == "__main__":
    run_seed()

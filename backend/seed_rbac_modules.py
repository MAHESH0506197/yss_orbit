import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.iam.models import RbacModule, RbacSubModule

MODULE_HIERARCHY = {
    "mainModules": [
        {"code": "hrms", "title": "HR & Payroll", "description": "Core HR, Attendance, Leave, Payroll", "icon": "Users"},
        {"code": "finance", "title": "Finance & Billing", "description": "Accounting, Invoicing, Taxes", "icon": "Wallet"},
        {"code": "operations", "title": "Operations", "description": "Inventory, POS, Logistics", "icon": "Layers"},
        {"code": "platform", "title": "Platform Admin", "description": "Settings, Security, Tenants", "icon": "Shield"},
    ],
    "subModules": {
        "hrms": [
            {"code": "core_hr", "title": "Core HR", "description": "Employee records and profiles"},
            {"code": "attendance", "title": "Attendance", "description": "Time tracking and shifts"},
            {"code": "leave", "title": "Leave", "description": "Time off and holidays"},
            {"code": "payroll", "title": "Payroll", "description": "Salary and compensation"},
            {"code": "appraisal", "title": "Appraisal", "description": "Performance and goals"},
            {"code": "recruitment", "title": "Recruitment", "description": "Hiring and onboarding"},
        ],
        "finance": [
            {"code": "accounting", "title": "Accounting", "description": "Ledgers and journals"},
            {"code": "invoicing", "title": "Invoicing", "description": "Customer billing"},
        ],
        "operations": [
            {"code": "inventory", "title": "Inventory", "description": "Stock management"},
            {"code": "pos", "title": "Point of Sale", "description": "Retail transactions"},
        ],
        "platform": [
            {"code": "settings", "title": "Settings", "description": "Global configuration"},
            {"code": "security", "title": "Security", "description": "Roles and permissions"},
        ],
    }
}

def seed():
    print("Seeding Rbac Modules...")
    for mod in MODULE_HIERARCHY["mainModules"]:
        module, created = RbacModule.objects.get_or_create(
            code=mod["code"],
            defaults={
                "title": mod["title"],
                "description": mod["description"],
                "icon": mod["icon"],
                "is_active": True,
            }
        )
        
        subs = MODULE_HIERARCHY["subModules"].get(mod["code"], [])
        for sub in subs:
            RbacSubModule.objects.get_or_create(
                code=sub["code"],
                defaults={
                    "parent_module": module,
                    "title": sub["title"],
                    "description": sub["description"],
                    "is_active": True,
                }
            )

    print("Seeding complete.")

if __name__ == "__main__":
    seed()

<!-- yss_orbit\rulebooks\B17 - SEED DATA, FIXTURES & INITIAL SETUP.md -->
# B17 - SEED DATA, FIXTURES & INITIAL SETUP

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B02 (Multi-Tenant), B07 (RBAC), B08 (Database Design)
**Governance Role:** Seed Data & Bootstrap Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Seed data standards, fixture governance, initial data bootstrap process, environment-specific seed separation, RBAC seed data, migration + seed coordination, idempotent seed execution |
| REFERENCES | B01 (soft delete, UUID PKs), B07 (role/permission seeding), B08 (migrations), B09 (no hardcoded secrets in fixtures) |
| MUST NOT DUPLICATE | Migration rules (B08), RBAC rules (B07), secrets management (B09) |

---

## 1. PURPOSE

This rulebook defines **seed data and initial setup standards** for YSS Orbit.

It establishes:
- Seed data governance
- Fixture management
- Initial data bootstrap process
- Environment-specific seed isolation

All seed data operations MUST follow these rules.

---

## 2. SCOPE

Applies to: all seed data scripts, all Django fixtures, all management commands for data initialization, all environment bootstrapping. No bootstrap operation is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Seed Data Must Be Idempotent (MANDATORY)

- All seed scripts MUST be idempotent - safe to run multiple times without creating duplicates or errors
- Non-idempotent seeds that produce duplicate data on re-run are PROHIBITED

```python
# REQUIRED pattern - idempotent seed:
def seed_domains():
    domains = [
        {"code": "RETAIL", "name": "Retail Operations"},
        {"code": "PHARMACY", "name": "Pharmacy Management"},
        {"code": "HRMS", "name": "Human Resource Management"},
        {"code": "MANUFACTURING", "name": "Manufacturing"},
        {"code": "EDUCATION", "name": "Education"},
        {"code": "HOSPITALITY", "name": "Hospitality"},
    ]
    for d in domains:
        Domain.objects.get_or_create(
            code=d["code"],
            defaults={"name": d["name"], "is_active": True}
        )

# PROHIBITED:
Sector.objects.create(code="RETAIL", name="Retail")  # 'Sector' is RETIRED
```

### 3.2 Environment Separation (MANDATORY)

Seed data MUST be separated per environment:

| Environment | Seed Content |
|------------|-------------|
| Production | Platform data ONLY (Domains, Roles, Permissions, System Config) |
| Staging | Platform data + representative test tenants |
| Development | All platform data + development fixtures |
| Testing | Minimal required data for test execution |

Rules:
- Production seed MUST NOT include test accounts, demo users, or sample business unit data
- Test/demo data in production is PROHIBITED
- Development-only fixtures MUST NOT be deployed to production

### 3.3 RBAC Seed Data (MANDATORY)

Permission and role seed data:
- All Permissions MUST be seeded before Roles
- All Roles MUST be seeded before UserBusinessUnit assignments
- Permission codes MUST match B07 standards (`MODULE_ACTION`, `UPPER_SNAKE_CASE`)
- Permission codes MUST be immutable after production deployment
- Seeding duplicate permission codes is PROHIBITED

```python
def seed_permissions():
    permissions = [
        {"code": "INVENTORY_VIEW",   "name": "View Inventory"},
        {"code": "INVENTORY_CREATE", "name": "Create Inventory"},
        {"code": "PAYROLL_VIEW",     "name": "View Payroll"},
        {"code": "BILLING_MANAGE",   "name": "Manage Billing"},
    ]
    for p in permissions:
        Permission.objects.get_or_create(
            code=p["code"],
            defaults={"name": p["name"], "is_active": True}
        )
```

### 3.4 Default Admin User (MANDATORY)

- A default SUPER_ADMIN user MUST exist for initial system access
- Default admin credentials MUST be environment-specific and configurable via environment variables
- Hardcoded admin credentials in seed scripts are PROHIBITED
- Default admin password MUST be changed immediately after first login (enforced by system)

```python
def seed_admin_user():
    admin_email = os.environ.get("DEFAULT_ADMIN_EMAIL")
    admin_password = os.environ.get("DEFAULT_ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise EnvironmentError("DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set")

    User.objects.get_or_create(
        email=admin_email,
        defaults={
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        }
    )
```

### 3.5 Platform Reference Data (MANDATORY)

The following MUST be seeded before any BusinessUnit or User data:

```text
1. Domains           ← was Sectors (RETIRED)
2. Modules           ← NEW: all platform modules
3. System configurations / settings
4. Permissions
5. Roles (with permission assignments)
6. Subscription Plans
7. Feature Flags
8. System SUPER_ADMIN user
```

Seeding business unit data before platform data is PROHIBITED.

### 3.10 Domain Seed Data (MANDATORY)

```python
def seed_domains():
    domains = [
        {"code": "RETAIL",         "name": "Retail Operations"},
        {"code": "PHARMACY",       "name": "Pharmacy Management"},
        {"code": "HRMS",           "name": "Human Resource Management"},
        {"code": "MANUFACTURING",  "name": "Manufacturing"},
        {"code": "EDUCATION",      "name": "Education"},
        {"code": "HOSPITALITY",    "name": "Hospitality"},
    ]
    for d in domains:
        Domain.objects.get_or_create(
            code=d["code"],
            defaults={"name": d["name"], "is_active": True}
        )
```

### 3.11 Module Seed Data (MANDATORY)

```python
def seed_modules():
    modules = [
        {"code": "HRMS_CORE",        "name": "Human Resource Management", "depends_on": []},
        {"code": "PAYROLL",          "name": "Payroll Management",         "depends_on": ["HRMS_CORE", "ATTENDANCE"]},
        {"code": "ATTENDANCE",       "name": "Attendance Tracking",        "depends_on": ["HRMS_CORE"]},
        {"code": "LEAVE_MGMT",       "name": "Leave Management",           "depends_on": ["HRMS_CORE"]},
        {"code": "RECRUITMENT",      "name": "Recruitment",                "depends_on": ["HRMS_CORE"]},
        {"code": "POS",              "name": "Point of Sale",              "depends_on": []},
        {"code": "INVENTORY",        "name": "Inventory Management",       "depends_on": []},
        {"code": "BILLING",          "name": "Billing & Invoicing",        "depends_on": []},
        {"code": "PHARMACY_BILLING", "name": "Pharmacy Billing",           "depends_on": ["INVENTORY"]},
        {"code": "EXPIRY_TRACKING",  "name": "Expiry & Batch Tracking",    "depends_on": ["INVENTORY"]},
        {"code": "VENDOR_MGMT",      "name": "Vendor Management",          "depends_on": ["INVENTORY"]},
    ]
    module_map = {}
    for m in modules:
        obj, _ = Module.objects.get_or_create(
            code=m["code"],
            defaults={"name": m["name"], "is_active": True}
        )
        module_map[m["code"]] = obj
    for m in modules:
        if m["depends_on"]:
            dep_ids = [module_map[dep].id for dep in m["depends_on"] if dep in module_map]
            module_map[m["code"]].depends_on = dep_ids
            module_map[m["code"]].save(update_fields=["depends_on"])
```

### 3.12 Subscription Plan Seed Data (MANDATORY)

```python
def seed_subscription_plans():
    plans = [
        {"code": "FREE",       "name": "Free",       "max_users": 5,    "max_business_units": 1,  "max_modules": 1,    "storage_quota_gb": 5},
        {"code": "BASIC",      "name": "Basic",      "max_users": 25,   "max_business_units": 3,  "max_modules": 3,    "storage_quota_gb": 25},
        {"code": "PRO",        "name": "Pro",        "max_users": 100,  "max_business_units": 10, "max_modules": None, "storage_quota_gb": 100},
        {"code": "ENTERPRISE", "name": "Enterprise", "max_users": None, "max_business_units": None, "max_modules": None, "storage_quota_gb": 500},
    ]
    for p in plans:
        SubscriptionPlan.objects.get_or_create(
            code=p["code"],
            defaults={**p, "is_active": True}
        )
```

### 3.13 Feature Flag Seed Data (MANDATORY)

```python
def seed_feature_flags():
    flags = [
        {"code": "advanced_payroll",      "plan_minimum": "PRO",        "default_enabled": False},
        {"code": "basic_payroll",          "plan_minimum": "FREE",       "default_enabled": True},
        {"code": "biometric_attendance",   "plan_minimum": "BASIC",      "default_enabled": False},
        {"code": "mobile_attendance",      "plan_minimum": "BASIC",      "default_enabled": False},
        {"code": "multi_branch_reports",   "plan_minimum": "PRO",        "default_enabled": False},
        {"code": "pos_offline_mode",       "plan_minimum": "PRO",        "default_enabled": False},
        {"code": "expiry_tracking",        "plan_minimum": "BASIC",      "default_enabled": False},
        {"code": "custom_roles",           "plan_minimum": "ENTERPRISE", "default_enabled": False},
        {"code": "api_access",             "plan_minimum": "PRO",        "default_enabled": False},
        {"code": "white_label",            "plan_minimum": "ENTERPRISE", "default_enabled": False},
    ]
    for f in flags:
        FeatureFlag.objects.get_or_create(
            code=f["code"],
            defaults={**f, "name": f["code"].replace("_", " ").title(), "is_active": True}
        )
```


### 3.6 Seed Script Management (MANDATORY)

- Seed scripts MUST be version-controlled
- Seed scripts MUST be tracked as management commands (`python manage.py seed_<domain>`)
- Seed scripts MUST be documented with: scope, environment target, dependencies, run order
- Seed scripts MUST be runnable without manual SQL

Recommended management command pattern:

```python
class Command(BaseCommand):
    help = "Seed platform domain data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding domains...")
        seed_domains()
        self.stdout.write(self.style.SUCCESS("Domains seeded successfully."))
```

### 3.7 Migration + Seed Coordination (MANDATORY)

- Database migrations MUST always run BEFORE seed scripts
- Seed scripts MUST NOT be embedded in migrations
- Migration rollback MUST NOT break seed script re-runs

### 3.8 No Hardcoded Sensitive Data (MANDATORY)

- Seed scripts MUST NOT contain hardcoded passwords, API keys, or secrets
- Sensitive values MUST be loaded from environment variables
- Seed scripts containing hardcoded secrets are PROHIBITED

### 3.9 Fixtures (MANDATORY)

- Django fixtures MUST be environment-specific
- Production fixtures MUST NOT include test data
- Fixtures MUST use UUIDs for primary keys (consistent with B08)

---

## 4. SECURITY & COMPLIANCE

- Hardcoded secrets in seed data = CRITICAL violation
- Test data in production = HIGH violation
- Non-idempotent seed causing duplicates = HIGH violation

---

## 5. NON-NEGOTIABLE RULES

- Non-idempotent seed = PROHIBITED
- Hardcoded admin credentials = PROHIBITED (CRITICAL)
- Test data in production fixtures = PROHIBITED
- Seed scripts outside version control = PROHIBITED
- Seed embedded in migrations = PROHIBITED
- Permissions seeded after Roles = PROHIBITED
- Using 'Sector'/'seed_sectors' instead of 'Domain'/'seed_domains' = PROHIBITED
- Missing Module, SubscriptionPlan, or FeatureFlag seed data = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- All seed scripts MUST be tested for idempotency (run twice, verify no duplicates)
- RBAC seed ordering MUST be tested
- Environment separation MUST be validated (no test data in production)
- Admin credential loading from env vars MUST be tested
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Seed scripts MUST be idempotent (safe to re-run)
- Platform data seeded first - then business unit data
- No hardcoded credentials in seed scripts
- Environment separation is mandatory
- Permissions before Roles - always

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

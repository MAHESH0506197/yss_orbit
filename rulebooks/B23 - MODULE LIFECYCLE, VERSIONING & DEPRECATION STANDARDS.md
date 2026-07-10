<!-- yss_orbit\rulebooks\B23 - MODULE LIFECYCLE, VERSIONING & DEPRECATION STANDARDS.md -->
# B23 - MODULE LIFECYCLE, VERSIONING & DEPRECATION STANDARDS

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Series:** Backend Platform Governance
**Depends On:** B01, B04, B05 (Module Isolation), E01 (Domain Events), E04 (Platform Governance - Module Registry)
**Governance Role:** Module Lifecycle Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Module version lifecycle (Alpha → Beta → GA → Deprecated → Retired), module versioning strategy, deprecation policy, compatibility contracts, module rollout strategy, mobile/offline module strategy, tenant migration between module versions |
| REFERENCES | E04 (module registry - version field), B12 (API versioning - aligns with module versioning), B08 (schema migrations per module), X04 (ARB approval for lifecycle changes), B21 (production checklist - module lifecycle checks) |
| MUST NOT DUPLICATE | Module registry schema (E04), API URL versioning (B12), database migration process (B08) |

---

## 1. PURPOSE

This rulebook defines the **complete lifecycle for every module** on the YSS Orbit platform - from initial development through general availability, deprecation, and eventual retirement.

Without this rulebook, the platform suffers from:
- Tenants running incompatible module versions with no migration path
- Breaking changes deployed without warning to subscribed tenants
- No clear deprecation process - old behaviour kept forever "just in case"
- Mobile/offline clients on old module versions breaking when servers update

This rulebook defines how modules are born, evolve, and retire safely.

---

## 2. MODULE LIFECYCLE STAGES (MANDATORY)

Every module MUST pass through stages in order. No module skips stages. The current stage is recorded in the `module` table (`lifecycle_stage` column - add to E04 §3.1 schema).

```
ALPHA → BETA → GA → DEPRECATED → RETIRED
```

| Stage | Meaning | Tenant Access | Breaking Changes Allowed? |
|-------|---------|--------------|--------------------------|
| **ALPHA** | Internal development and testing only | Internal YSS engineers only | YES - no stability guarantee |
| **BETA** | Pilot tenants testing | Opt-in pilot tenants only (via `beta_access` feature flag) | YES - with pilot tenant notice |
| **GA (General Availability)** | Stable - all eligible tenants | All subscribed tenants | NO - any breaking change requires new version |
| **DEPRECATED** | Successor available - still works | Existing subscribers only (no new subscriptions) | NO - only critical security fixes |
| **RETIRED** | No longer operational | No tenant access | N/A |

### 2.1 Stage Transition Rules

```
ALPHA → BETA:
  - ARB approval required (X04)
  - All unit and integration tests passing at 100%
  - At least 2 internal engineers have reviewed the module boundary (B05)
  - Module catalogue entry complete in E04

BETA → GA:
  - ARB approval required
  - Minimum 30-day beta period with at least 2 pilot tenants
  - All beta-identified bugs resolved
  - Performance benchmarks met (B19 SLO targets)
  - Documentation complete (API reference + admin guide)
  - Zero known critical or high-severity bugs

GA → DEPRECATED:
  - ARB approval required
  - Successor module or version identified and at GA
  - Minimum 6-month deprecation notice period
  - All subscribed tenants notified via email + in-app notification
  - Migration guide published

DEPRECATED → RETIRED:
  - ARB approval required
  - Minimum 6 months after DEPRECATED announcement
  - Zero active tenant subscriptions remaining (all migrated or cancelled)
  - Data archival completed (C03 retention rules)
  - API endpoints removed from routing
```

---

## 3. MODULE VERSION STRATEGY (MANDATORY)

### 3.1 Module Version vs API Version

These are SEPARATE concepts that MUST NOT be confused:

| Concept | What it versions | Where stored | Format |
|---------|-----------------|--------------|--------|
| **Module Version** | The entire functional module (schema + business logic + API surface) | `module.version` in DB | `MAJOR.MINOR.PATCH` |
| **API Version** | The URL-level API contract | URL prefix `/api/v1/` | `v1`, `v2` |
| **Event Version** | A specific domain event contract | `event_version` field | `1.0`, `2.0` |

A Module at version `2.0.0` still serves its API on `/api/v1/` unless the API contract itself broke (which would require a new `/api/v2/` URL prefix per B12).

### 3.2 Semantic Versioning for Modules (MANDATORY)

```
MAJOR.MINOR.PATCH

MAJOR - increments when:
  - A breaking change in the module's public API surface (new API version required)
  - A breaking change in the module's database schema that requires tenant data migration
  - A fundamental change in the module's domain model

MINOR - increments when:
  - New features added in a backward-compatible way
  - New optional fields added to API responses
  - New endpoints added (no existing endpoints changed)

PATCH - increments when:
  - Bug fixes
  - Performance improvements
  - Security patches (with no API or schema changes)
```

### 3.3 Version Recorded in Module Registry

```sql
-- Add to module table (E04 §3.1):
ALTER TABLE module ADD COLUMN version VARCHAR(20) NOT NULL DEFAULT '1.0.0';
ALTER TABLE module ADD COLUMN lifecycle_stage VARCHAR(20) NOT NULL DEFAULT 'ga';
    -- ENUM: 'alpha', 'beta', 'ga', 'deprecated', 'retired'
ALTER TABLE module ADD COLUMN deprecated_at TIMESTAMPTZ;
ALTER TABLE module ADD COLUMN retire_at TIMESTAMPTZ;       -- planned retirement date
ALTER TABLE module ADD COLUMN successor_module_id UUID REFERENCES module(id);
ALTER TABLE module ADD COLUMN migration_guide_url VARCHAR(500);
ALTER TABLE module ADD COLUMN changelog_url VARCHAR(500);
```

---

## 4. DEPRECATION POLICY (MANDATORY)

### 4.1 Deprecation Notice Requirements

When a module moves from GA to DEPRECATED:

**Minimum 6 months notice before DEPRECATED → RETIRED.**

Notifications MUST be sent:
1. **Day 0 (Deprecation announced):** Email to all ORG_ADMIN users of subscribed tenants + in-app banner for BU_ADMIN users
2. **Month 3:** Second email reminder + dashboard warning banner
3. **Month 5:** Final email warning - 30 days remaining + direct outreach from YSS support
4. **Day of Retirement:** Module access blocked - tenants see migration guidance page

### 4.2 API Deprecation Header (MANDATORY)

Deprecated module API endpoints MUST return the `Deprecation` response header:

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Nov 2025 00:00:00 GMT
Link: <https://docs.yssorbit.com/modules/payroll-v2/migration>; rel="successor-version"
X-Deprecation-Message: This module version will be retired on 1 Nov 2025. Please migrate to PAYROLL v2.0.
```

This header MUST be present on EVERY response from a deprecated module - not just on errors.

### 4.3 No Forced Breaking Changes Without Migration Path

- A tenant MUST NEVER have their module subscription broken without a migration path available
- If MAJOR version increment is required, both old and new versions MUST run in parallel during the migration window
- Tenants MUST be able to opt-in to the new version (via `business_unit_module.module_version` field) and revert during beta
- The retirement date sets the hard deadline - after that date, the old version is removed

---

## 5. ROLLOUT STRATEGY (MANDATORY)

### 5.1 Phased Rollout (MANDATORY for MAJOR version releases)

```
Phase 1 - Internal (1 week):
  YSS engineers test on staging environment
  Automated test suite must pass 100%

Phase 2 - Pilot (2–4 weeks):
  Enable for 2–5 volunteer pilot tenants via feature flag
  Monitor: error rates, performance, tenant feedback
  Gate: zero P1 bugs, P95 latency within SLO

Phase 3 - Progressive Rollout (2–4 weeks):
  Enable for 10% of subscribed tenants
  Monitor for 1 week - check error rates and performance
  Expand to 50% if healthy - monitor 1 week
  Expand to 100% if healthy

Phase 4 - GA (stable):
  Available to all new subscribers
  Old version deprecation clock starts
```

### 5.2 Rollout Governance

- Each phase transition requires explicit ARB sign-off
- Any P1 bug during rollout halts the rollout immediately and triggers rollback
- Rollback must be possible within 30 minutes of any phase
- Rollback plan MUST be documented before Phase 1 begins

---

## 6. MOBILE & OFFLINE MODULE STRATEGY (MANDATORY)

Certain modules (primarily Attendance, POS) MUST support mobile and offline operation. This introduces module versioning complexity because mobile clients cannot be force-updated instantly.

### 6.1 Offline-Capable Modules

| Module | Offline Support | Sync Strategy |
|--------|----------------|--------------|
| ATTENDANCE | ✅ (mobile check-in) | Sync on reconnect with conflict resolution |
| POS | ✅ (offline billing mode - PRO feature flag) | Sync on reconnect, idempotent bill IDs |
| INVENTORY | Partial (read-only offline) | Pull-only cache |
| HRMS / PAYROLL | ❌ No offline | Online-only operations |

### 6.2 Mobile API Version Compatibility Window (MANDATORY)

Mobile clients CANNOT always be force-updated. The platform MUST maintain backwards compatibility for mobile API consumers for a minimum **12-month window** (twice the deprecation window of 6 months for web clients).

```
Mobile compatibility rule:
- /api/v1/ endpoints used by mobile MUST remain functional for 12 months after a new version
- Mobile clients MUST send their app version in the User-Agent header:
  User-Agent: YSSOrbit-Mobile/2.3.1 (iOS 17.0)
- Backend MUST log mobile client versions per tenant for compatibility analysis
```

### 6.3 Offline Sync Conflict Resolution (MANDATORY)

When a mobile client reconnects after offline operation, conflicts MUST be resolved:

```python
# Attendance offline sync conflict resolution:
def sync_offline_attendance(records: list[OfflineAttendanceRecord], ctx: SecurityContext):
    for record in records:
        existing = AttendanceRepo.get_by_employee_date(
            employee_id=record.employee_id,
            date=record.date,
            ctx=ctx,
        )
        if existing is None:
            # No conflict - save offline record
            AttendanceRepo.create(record, ctx)
        elif existing.source == 'biometric' and record.source == 'mobile':
            # Biometric takes precedence over mobile
            pass  # Skip mobile record - biometric is authoritative
        elif existing.source == 'manual' and record.source == 'mobile':
            # Mobile timestamp is more accurate than manual entry
            AttendanceRepo.update_if_mobile_newer(existing, record, ctx)
        # Always audit the conflict resolution decision
        AuditLog.write(action='OFFLINE_SYNC_CONFLICT_RESOLVED', ctx=ctx, ...)
```

**Conflict resolution rules MUST be:**
1. Deterministic (same input always produces same output)
2. Audited (every resolution decision logged)
3. Configurable per tenant (via `tenant_settings` - not hardcoded)
4. Idempotent (syncing the same offline batch twice produces same result)

### 6.4 Device Registration (MANDATORY for offline-capable modules)

Mobile devices used for offline operations MUST be registered:

```sql
CREATE TABLE registered_device (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    user_id          UUID NOT NULL REFERENCES users(id),
    device_id        VARCHAR(200) NOT NULL,   -- unique device identifier
    device_type      VARCHAR(20) NOT NULL,    -- 'ios' | 'android' | 'web'
    app_version      VARCHAR(20) NOT NULL,
    last_sync_at     TIMESTAMPTZ,
    is_active        BOOLEAN DEFAULT TRUE,
    registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_unit_id, device_id)
);
```

Unregistered devices MUST NOT be allowed to submit offline sync data.

---

## 7. PERMISSION TAXONOMY & LIFECYCLE (MANDATORY - Addresses Audit Gap #12)

As the platform grows, permission codes can explode into hundreds of entries with no coherent structure. This section defines the taxonomy to prevent permission chaos.

### 7.1 Permission Naming Taxonomy

```
Format: {module_code}.{resource}.{action}

Examples:
  hrms.employee.view
  hrms.employee.create
  hrms.employee.update
  hrms.employee.terminate
  hrms.department.manage
  payroll.run.create
  payroll.run.approve
  payroll.run.export
  inventory.item.view
  inventory.stock.adjust
  pos.bill.create
  pos.bill.refund
  platform.module.activate
  platform.subscription.manage
  branding.config.update
```

### 7.2 Permission Grouping

Permissions MUST be grouped by module in the permission registry. The UI for role assignment MUST present permissions grouped - never as a flat list of hundreds of codes.

```python
PERMISSION_GROUPS = {
    'HRMS': [
        'hrms.employee.view', 'hrms.employee.create',
        'hrms.employee.update', 'hrms.employee.terminate',
        'hrms.department.manage', 'hrms.designation.manage',
    ],
    'Payroll': [
        'payroll.run.create', 'payroll.run.approve',
        'payroll.run.export', 'payroll.salary.update',
        'payroll.component.manage',
    ],
    'Inventory': [
        'inventory.item.view', 'inventory.item.manage',
        'inventory.stock.adjust', 'inventory.transfer.request',
        'inventory.transfer.approve',
    ],
    'POS': [
        'pos.bill.create', 'pos.bill.refund',
        'pos.discount.override', 'pos.session.manage',
    ],
    'Platform Admin': [
        'platform.module.activate', 'platform.subscription.manage',
        'platform.user.invite', 'platform.role.manage',
        'branding.config.update',
    ],
}
```

### 7.3 Permission Lifecycle

- Permissions MUST be seeded in `B17` alongside modules
- Deprecated modules' permissions MUST be marked `is_active = FALSE` - not deleted
- Retired module permissions MUST be retained in DB for audit trail (historical role records reference them)
- New permissions MUST be reviewed by ARB before seeding (prevents permission sprawl)
- Permission codes MUST follow X01 naming convention - never renamed after creation (breaking existing role assignments)

---

## 8. NON-NEGOTIABLE RULES

- No module skips lifecycle stages (ALPHA → BETA → GA → DEPRECATED → RETIRED)
- MAJOR version increment without parallel run during migration window = PROHIBITED
- Deprecation without minimum 6-month notice = PROHIBITED
- Breaking API changes without Deprecation + Sunset headers = PROHIBITED
- Mobile compatibility window below 12 months = PROHIBITED
- Offline sync data accepted from unregistered devices = PROHIBITED
- Permission code renamed after creation = PROHIBITED
- Module retired with active tenant subscriptions remaining = PROHIBITED

---

## 9. PRODUCTION CHECKLIST ADDITIONS

Before any module version promotion (BETA → GA or GA → DEPRECATED):

- [ ] ARB approval obtained
- [ ] Module lifecycle stage updated in `module` table
- [ ] If DEPRECATED: Deprecation email sent to all ORG_ADMIN users of subscribed tenants
- [ ] If DEPRECATED: In-app banner activated for affected tenants
- [ ] If DEPRECATED: Deprecation + Sunset headers added to all module endpoints
- [ ] If RETIRED: Zero active subscriptions confirmed
- [ ] If RETIRED: Data archival completed per C03
- [ ] Migration guide URL populated in `module.migration_guide_url`

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*

<!-- yss_orbit\rulebooks\B24 - ENTERPRISE OPERATIONS, SUPPORT & TENANT LIFECYCLE.md -->
# B24 - ENTERPRISE OPERATIONS, SUPPORT & TENANT LIFECYCLE

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Series:** Backend Platform Governance
**Depends On:** B01, B02 (Multi-Tenant), B07 (RBAC), B15 (Audit Logging), C01 (Data Privacy), C03 (Audit Retention)
**Governance Role:** Enterprise Operations Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Support impersonation system, tenant diagnostics, tenant onboarding automation, tenant offboarding / GDPR exit, zero-downtime tenant migration, platform health dashboard, support audit trails, issue replay governance |
| REFERENCES | B02 (tenant isolation - impersonation must not break it), B07 (RBAC - impersonation uses special role), B15 (audit logging - all support actions logged), C01 (GDPR/DPDP - data export and deletion), C03 (retention policy - governs offboarding), B08 (migrations), E03 (observability - health dashboard) |
| MUST NOT DUPLICATE | RBAC mechanics (B07), audit log format (B15), data retention policy (C03), GDPR obligations (C01) |

---

## 1. PURPOSE

This rulebook defines the **enterprise operations standards** for YSS Orbit - covering how the YSS support and operations teams manage tenants at scale, and how tenants are onboarded and offboarded safely.

Architecture excellence means nothing if the platform cannot be operated, supported, and maintained at enterprise scale. This rulebook bridges the gap between engineering architecture and operational reality.

---

## 2. SUPPORT IMPERSONATION SYSTEM (MANDATORY)

### 2.1 What is Impersonation

Impersonation allows a SUPER_ADMIN (YSS support engineer) to temporarily act as a specific user within a specific BusinessUnit - to diagnose issues, verify configurations, or reproduce bugs reported by the tenant.

### 2.2 Why Governed Impersonation is Mandatory

Without a governed impersonation system:
- Support engineers access tenant data directly via the database (no audit trail)
- There is no record of what a support engineer did inside a tenant's account
- Tenant data privacy is violated without the tenant's knowledge
- Regulatory audits find unauthorised access with no justification

### 2.3 Impersonation Database Schema

```sql
CREATE TABLE support_impersonation_session (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID NOT NULL UNIQUE,
    support_user_id  UUID NOT NULL REFERENCES users(id),   -- who is impersonating
    target_user_id   UUID NOT NULL REFERENCES users(id),   -- who is being impersonated
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    reason           TEXT NOT NULL,                         -- mandatory justification
    ticket_ref       VARCHAR(100),                          -- support ticket ID
    approved_by      UUID REFERENCES users(id),             -- second SUPER_ADMIN approval
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ NOT NULL,                  -- max 4 hours from start
    ended_at         TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    actions_count    INTEGER NOT NULL DEFAULT 0             -- incremented on each action
);
```

### 2.4 Impersonation Rules (MANDATORY)

- **Dual approval:** Impersonation MUST be approved by a SECOND SUPER_ADMIN - not the engineer requesting it
- **Maximum session duration:** 4 hours. Sessions cannot be extended - a new session requires new approval
- **Mandatory justification:** `reason` and `ticket_ref` fields are REQUIRED - not optional
- **Tenant notification:** The ORG_ADMIN of the affected tenant MUST be notified by email when impersonation starts (configurable - some enterprise clients mandate this)
- **Audit everything:** EVERY action taken during an impersonation session MUST be logged in `audit_log` with `impersonation_session_id` field
- **Read-only mode option:** Impersonation sessions SHOULD default to read-only unless write access is explicitly approved
- **Automatic expiry:** Expired sessions MUST be automatically terminated - the system revokes the session token at `expires_at`

### 2.5 Impersonation Security Context Extension

```python
@dataclass(frozen=True)
class SecurityContext:
    user_id: UUID
    selected_business_unit_id: UUID
    # ... existing fields ...

    # Impersonation extension:
    is_impersonating: bool = False
    impersonation_session_id: Optional[UUID] = None
    original_support_user_id: Optional[UUID] = None   # actual engineer, not impersonated user
```

All audit logs MUST include `impersonation_session_id` when `is_impersonating = True`, so every action can be traced to both the target user AND the support engineer who triggered it.

### 2.6 Impersonation API

```
# Start impersonation (SUPER_ADMIN only - requires second SUPER_ADMIN approval):
POST /api/v1/platform/impersonation/sessions/
Body: { target_user_id, business_unit_id, reason, ticket_ref }
→ 201 Created: { session_id, impersonation_token, expires_at }

# End impersonation session:
DELETE /api/v1/platform/impersonation/sessions/{session_id}/

# List active impersonation sessions (SUPER_ADMIN only):
GET /api/v1/platform/impersonation/sessions/?is_active=true

# View impersonation audit trail for a tenant:
GET /api/v1/platform/impersonation/sessions/?business_unit_id={business_unit_id}
```

---

## 3. TENANT DIAGNOSTICS (MANDATORY)

### 3.1 What Tenant Diagnostics Covers

Support engineers MUST be able to diagnose tenant issues WITHOUT impersonating. A diagnostic dashboard provides:

- Current subscription plan and module subscriptions
- Active feature flags and overrides
- Recent audit log entries (last 50 actions)
- Failed background jobs in the last 24 hours
- Dead-letter events related to this tenant
- Active orchestrator workflows (running/failed)
- Recent API error rates (by endpoint, last 1 hour)
- Current cache state for key tenant settings
- Health of tenant's background job queue

### 3.2 Diagnostics API (SUPER_ADMIN only)

```
GET /api/v1/platform/diagnostics/{business_unit_id}/
→ Returns diagnostic snapshot (no tenant business data - only platform health)

GET /api/v1/platform/diagnostics/{business_unit_id}/jobs/
→ Recent background jobs and failed jobs

GET /api/v1/platform/diagnostics/{business_unit_id}/events/
→ Recent domain events published and dead-letter entries

GET /api/v1/platform/diagnostics/{business_unit_id}/audit/?limit=50
→ Last 50 audit log entries for the tenant

GET /api/v1/platform/diagnostics/{business_unit_id}/feature-flags/
→ All feature flags and their resolved values for this tenant
```

**Security:** Diagnostics endpoints MUST be restricted to `SUPER_ADMIN` role only. They MUST be audit-logged on every access. They MUST NOT return business data (employee names, payroll amounts, invoices) - only platform operational data.

---

## 4. TENANT ONBOARDING SYSTEM (MANDATORY)

### 4.1 Why Automated Onboarding is Mandatory

Manual onboarding is:
- Error-prone (forgot to set up payroll cycle, wrong timezone, roles not assigned)
- Not scalable (each new tenant takes hours of manual work)
- Inconsistent (different support engineers set up tenants differently)

The platform MUST have an automated onboarding orchestrator.

### 4.2 Onboarding Orchestrator

```python
class TenantOnboardingOrchestrator:
    """
    Governs the complete tenant onboarding workflow.
    Called when a new Organization + BusinessUnit is created.
    """

    def onboard(self, onboarding_data: TenantOnboardingDTO, ctx: SecurityContext) -> UUID:
        workflow_id = uuid4()
        try:
            # Step 1 - Create Organization
            org_id = self._org_service.create(onboarding_data.organization, ctx)
            self._state.mark_step(workflow_id, 'ORG_CREATED', org_id)

            # Step 2 - Create first BusinessUnit (HQ/Main branch)
            business_unit_id = self._bu_service.create(onboarding_data.business_unit, org_id, ctx)
            self._state.mark_step(workflow_id, 'BU_CREATED', business_unit_id)

            # Step 3 - Apply subscription plan
            self._subscription_service.activate_plan(
                business_unit_id, onboarding_data.plan_code, ctx
            )
            self._state.mark_step(workflow_id, 'PLAN_ACTIVATED')

            # Step 4 - Activate selected modules
            for module_code in onboarding_data.initial_modules:
                self._module_service.activate(business_unit_id, module_code, ctx)
            self._state.mark_step(workflow_id, 'MODULES_ACTIVATED')

            # Step 5 - Apply tenant settings
            self._settings_service.apply_defaults(business_unit_id, onboarding_data.settings, ctx)
            self._state.mark_step(workflow_id, 'SETTINGS_CONFIGURED')

            # Step 6 - Create ORG_ADMIN user
            admin_user_id = self._user_service.create_org_admin(
                onboarding_data.admin_user, org_id, business_unit_id, ctx
            )
            self._state.mark_step(workflow_id, 'ADMIN_USER_CREATED', admin_user_id)

            # Step 7 - Apply branding defaults (Mode 1 - Platform Brand)
            self._branding_service.apply_defaults(org_id, ctx)
            self._state.mark_step(workflow_id, 'BRANDING_CONFIGURED')

            # Step 8 - Send welcome email
            self._notification_service.send_onboarding_welcome(
                org_id, business_unit_id, admin_user_id, ctx
            )
            self._state.mark_step(workflow_id, 'WELCOME_SENT')

            # Step 9 - Publish domain event
            self._events.publish(TenantOnboardedEvent(
                organization_id=org_id,
                business_unit_id=business_unit_id,
                correlation_id=ctx.correlation_id,
            ))
            self._state.mark_completed(workflow_id)
            return business_unit_id

        except Exception as e:
            self._state.mark_failed(workflow_id, str(e))
            self._compensate_onboarding(workflow_id, ctx)
            raise

    def _compensate_onboarding(self, workflow_id: UUID, ctx: SecurityContext):
        state = self._state.get(workflow_id)
        # Reverse order compensation
        if 'ADMIN_USER_CREATED' in state.completed_steps:
            self._user_service.soft_delete(state.entity_id, ctx)
        if 'MODULES_ACTIVATED' in state.completed_steps:
            self._module_service.deactivate_all(state.business_unit_id, ctx)
        if 'BU_CREATED' in state.completed_steps:
            self._bu_service.soft_delete(state.business_unit_id, ctx)
        if 'ORG_CREATED' in state.completed_steps:
            self._org_service.soft_delete(state.org_id, ctx)
```

### 4.3 Onboarding Checklist (Automated Verification)

After onboarding orchestrator completes, run automated verification:

```python
def verify_onboarding(business_unit_id: UUID) -> OnboardingVerificationResult:
    checks = [
        ('Organization exists and active',   Organization.objects.filter(id=org_id, is_active=True).exists()),
        ('BusinessUnit exists and active',   BusinessUnit.objects.filter(id=business_unit_id, is_active=True).exists()),
        ('Plan subscription active',         BusinessUnitSubscription.objects.filter(business_unit_id=business_unit_id, status='active').exists()),
        ('At least 1 module active',         BusinessUnitModule.objects.filter(business_unit_id=business_unit_id, status='active').exists()),
        ('ORG_ADMIN user exists',            UserBusinessUnit.objects.filter(business_unit_id=business_unit_id, role__code='ORG_ADMIN').exists()),
        ('Timezone setting configured',      TenantSettings.objects.filter(business_unit_id=business_unit_id, key='timezone').exists()),
        ('Welcome email sent',               Notification.objects.filter(business_unit_id=business_unit_id, template_code='ONBOARDING_WELCOME').exists()),
        ('Branding config created',          BrandConfiguration.objects.filter(organization_id=org_id).exists()),
    ]
    return OnboardingVerificationResult(checks=checks)
```

---

## 5. ZERO-DOWNTIME TENANT MIGRATION (MANDATORY)

### 5.1 When Tenant Migration is Required

- Module MAJOR version upgrade (new schema, new API)
- Tenant plan upgrade requiring schema-level changes (rare - most plan changes are config-only)
- Data correction operations approved by ARB
- Cross-BusinessUnit data consolidation (Organisation restructure)

### 5.2 Zero-Downtime Migration Process (MANDATORY)

```
Step 1 - PREPARE (no downtime):
  - Add new columns/tables alongside old ones
  - Deploy code that reads from NEW columns if present, falls back to OLD columns
  - Dual-write: all writes go to BOTH old and new columns
  - Verify dual-write working in production for 24 hours

Step 2 - BACKFILL (no downtime):
  - Backfill job runs asynchronously to populate new columns from old data
  - Backfill is idempotent (safe to re-run)
  - Monitor progress via background_jobs table
  - Tenant remains fully operational during backfill

Step 3 - VERIFY (no downtime):
  - Verify 100% of rows have new column populated
  - Spot-check data integrity (sample 1000 rows)
  - ARB sign-off on data integrity

Step 4 - SWITCH (no downtime):
  - Deploy code that reads ONLY from new columns
  - Remove dual-write (writes go only to new columns)
  - Old columns remain in schema (not yet dropped)

Step 5 - CLEANUP (scheduled maintenance window - optional):
  - Drop old columns (non-breaking - only cleanup)
  - This step CAN have a short maintenance window if needed
  - Not urgent - can be done months later

TOTAL DOWNTIME: Zero (Steps 1–4). Optional maintenance for Step 5.
```

### 5.3 Backfill Job Standard

```python
@shared_task(bind=True, name='migration.backfill_tenant_data')
def backfill_tenant_data(
    self,
    business_unit_id: str,
    migration_name: str,
    batch_size: int = 500,
    correlation_id: str = None,
):
    """
    Idempotent backfill job for zero-downtime migration.
    Runs in batches to avoid locking the DB.
    Safe to re-run - skips already-migrated rows.
    """
    bu_uuid = UUID(business_unit_id)
    offset = 0

    while True:
        batch = get_unmigrated_batch(bu_uuid, migration_name, batch_size, offset)
        if not batch:
            break
        for record in batch:
            migrate_record(record, migration_name)
        offset += len(batch)
        # Small sleep between batches to avoid DB pressure
        time.sleep(0.1)

    logger.info(f"Backfill complete", extra={
        'migration': migration_name,
        'business_unit_id': str(bu_uuid),
        'correlation_id': correlation_id,
    })
```

---

## 6. TENANT OFFBOARDING & GDPR EXIT (MANDATORY)

### 6.1 When Offboarding is Triggered

- Tenant voluntarily cancels subscription
- Tenant fails to renew (plan expired with no renewal after grace period)
- Legal/compliance requirement (court order, regulatory)
- YSS terminates contract (policy violation)

### 6.2 Offboarding Process

```
Phase 1 - GRACE PERIOD (30 days after cancellation):
  - Subscription marked 'cancelled' but data remains fully accessible
  - All module APIs continue to work
  - ORG_ADMIN notified: "Your account will be closed in 30 days. Export your data."
  - Data export pack generated and made available for download (see §6.3)

Phase 2 - SUSPENDED (Day 30 after cancellation):
  - All API access suspended - 402 response with offboarding message
  - Data still retained in DB (not deleted)
  - ORG_ADMIN can still download their data export pack

Phase 3 - ARCHIVED (Day 60 or when GDPR deletion requested):
  - If GDPR/DPDP deletion requested: execute data deletion per C01 §5
  - If no deletion request: data archived per C03 retention policy
  - BusinessUnit marked is_deleted = TRUE
  - Organization marked is_deleted = TRUE (if no other active BUs)

Phase 4 - PURGED (per C03 statutory retention periods):
  - Financial records: retained 7 years from last transaction (statutory)
  - Payroll records: retained 7 years (statutory)
  - Audit logs: retained per C03 policy (7 years)
  - All other data: purged after retention period expires
```

### 6.3 Data Export Pack (GDPR/DPDP Compliance - MANDATORY)

On offboarding initiation, the platform MUST generate a complete data export for the tenant:

```python
class TenantDataExportOrchestrator:
    """
    Generates a complete ZIP archive of all tenant data for GDPR portability.
    Runs as a background job - large tenants may take 30+ minutes.
    """
    def export(self, organization_id: UUID, business_unit_id: UUID, ctx: SecurityContext) -> str:
        export_sections = [
            ('employees',       EmployeeExportService),
            ('attendance',      AttendanceExportService),
            ('payroll',         PayrollExportService),
            ('leave_requests',  LeaveExportService),
            ('invoices',        InvoiceExportService),
            ('audit_logs',      AuditExportService),
            ('users',           UserExportService),
            ('settings',        SettingsExportService),
        ]
        # Each section exports to CSV/JSON
        # Package into ZIP archive
        # Upload to secure S3 path
        # Return pre-signed download URL (valid 7 days)
        ...
```

**Format requirements:**
- Machine-readable: JSON or CSV (both preferred)
- Complete: ALL tenant data within the BusinessUnit
- Documented: README.txt in the export explaining the data schema
- Secure: Pre-signed URL, expires in 7 days, accessible only to ORG_ADMIN

---

## 7. PLATFORM HEALTH DASHBOARD (MANDATORY for Operations Team)

The YSS operations team MUST have a platform health dashboard that shows:

```
/platform/admin/health/                    (SUPER_ADMIN only)

Sections:
1. Platform Overview
   - Total active Organizations
   - Total active BusinessUnits
   - Total active users (last 30 days)
   - API requests/hour (last 24 hours)
   - Error rate (5xx %)

2. Per-Tenant Health Grid
   - Each tenant's subscription status, active modules, last activity
   - Colour-coded: Green (healthy) / Yellow (warning) / Red (error/expired)

3. Infrastructure
   - Background job queue depths per module queue
   - Outbox event pending count
   - Dead-letter event count and oldest entry age
   - Redis cache hit rate
   - Database connection pool utilization

4. Recent Alerts
   - Last 50 monitoring alerts with severity and resolution status

5. Active Impersonation Sessions
   - Any ongoing support impersonation sessions
```

This dashboard consumes E03 observability data. It MUST NOT be built by querying tenant business tables directly - use metrics and operational tables only.

---

## 8. NON-NEGOTIABLE RULES

- Support access to tenant data without impersonation session = PROHIBITED
- Impersonation without dual SUPER_ADMIN approval = PROHIBITED
- Impersonation session > 4 hours = PROHIBITED
- Tenant offboarding without 30-day grace period = PROHIBITED (unless court order)
- Data export pack NOT provided on offboarding request = GDPR violation
- Zero-downtime migration skipping PREPARE phase = PROHIBITED
- Backfill job that is NOT idempotent = PROHIBITED
- Onboarding without automated verification = PROHIBITED
- Diagnostics API returning tenant business data = PROHIBITED (operational data only)
- Impersonation action NOT audit-logged = CRITICAL compliance violation

---

*THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARB APPROVAL.*

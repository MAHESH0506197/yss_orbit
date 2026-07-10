<!-- yss_orbit\rulebooks\C03 - AUDIT COMPLIANCE & RETENTION POLICY.md -->
# C03 - AUDIT COMPLIANCE & RETENTION POLICY

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B15 (Audit Implementation), C01 (Privacy Framework), C02 (Data Classification)
**Governance Role:** Audit Compliance Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Audit compliance obligations, legal retention periods, audit log retention, audit log immutability requirements, compliance reporting obligations, audit coverage requirements, legal hold process |
| REFERENCES | B15 (audit log implementation mechanics), C01 (data retention policy), B09 (encryption of audit data), C02 (data classification) |
| MUST NOT DUPLICATE | Audit log technical implementation (B15), encryption mechanics (B09), privacy rights (C01) |

---

## 1. PURPOSE

This rulebook defines **audit compliance and retention policy** for YSS Orbit.

It establishes:
- Mandatory audit coverage
- Legal retention periods
- Audit immutability obligations
- Compliance reporting
- Legal hold readiness

All audit records MUST comply with these standards.

---

## 2. SCOPE

Applies to: all audit log records, all compliance-related activity records, all security event records, all access logs. No audit record is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Mandatory Audit Coverage (MANDATORY)

The following events MUST be audited (implementation per B15):

| Event Category | MUST Audit |
|---------------|-----------|
| Authentication | Login, logout, login failure, account lockout, MFA events |
| Authorization | Permission denied, privilege escalation attempts, cross-tenant access attempts |
| Data Mutations | All CREATE, UPDATE, DELETE on Tenant-Owned data with old_values and new_values |
| User Management | User creation, deactivation, role changes, permission changes |
| Tenant Management | BusinessUnit creation, modification, membership changes |
| Security Events | Password reset, MFA change, failed brute-force |
| File Operations | Upload, download, deletion of tenant-owned files |
| Break-Glass Access | All break-glass sessions with user_id, timestamp, scope, actions taken |
| Impersonation Events | All session starts, actions taken during impersonation, session ends — each entry MUST include `impersonation_session_id` per B24 §2.5 |
| Compliance Events | Consent changes, data subject requests, data deletion/anonymization |

Events NOT present in this list MAY be audited at discretion - but events IN this list MUST always be audited.

### 3.2 Audit Log Immutability (MANDATORY)

- Audit logs are APPEND-ONLY
- Update or deletion of audit log records is PROHIBITED
- Direct database access to modify audit logs is PROHIBITED
- Audit log integrity MUST be technically enforced:
  - Database user for the application MUST NOT have UPDATE or DELETE rights on the audit_logs table
  - Audit log table MUST use append-only access controls in production

```sql
-- Production enforcement:
REVOKE UPDATE ON audit_logs FROM app_user;
REVOKE DELETE ON audit_logs FROM app_user;
GRANT INSERT ON audit_logs TO app_user;
GRANT SELECT ON audit_logs TO app_user;
```

**Violation:** Any modification of audit logs = CRITICAL compliance breach.

### 3.3 Retention Periods (MANDATORY)

| Record Type | Minimum Retention | Maximum Retention |
|------------|------------------|------------------|
| Security events (login, auth failures) | 2 years | 5 years |
| Data mutation audit logs | 5 years | 10 years |
| Payroll audit logs | 7 years (statutory) | 10 years |
| Compliance events (consent, DSAR) | 5 years | 10 years |
| Break-glass access logs | 5 years | 10 years |
| Impersonation session records | 2 years | 5 years |
| Access certification records (C04 §3.7) | 5 years | 10 years |
| File access logs | 2 years | 5 years |
| Application logs (errors, debug) | 30 days | 90 days |

Rules:
- Audit logs MUST NOT be deleted before the minimum retention period
- Automated retention enforcement MUST purge ONLY application logs beyond their retention period
- Audit log deletion before minimum retention period = CRITICAL compliance violation

### 3.4 Legal Hold Process (MANDATORY)

When a legal hold is issued:
- Affected records MUST be tagged with a `legal_hold=True` flag
- Legal hold records MUST NOT be deleted, anonymized, or modified
- Legal hold MUST override all automated retention deletion processes
- Legal holds MUST be documented with: issuer, scope, date, reason
- Legal hold release MUST require documented authorization

### 3.4a Legal Hold vs. Right to Erasure (MANDATORY)

When a legal hold is active on records belonging to a data subject who has submitted an erasure request (C01 §4.5):
- The erasure MUST be deferred until the legal hold is released
- **Legal hold takes precedence over Right to Erasure**
- The data subject MUST be notified within 30 days of their erasure request that it is deferred pending legal hold release
- This deferral MUST be documented in the compliance event audit log

### 3.5 Compliance Reporting (MANDATORY)

- Audit data MUST be queryable for compliance reporting
- Security event reports MUST be available to authorized compliance personnel
- Audit queries MUST be access-controlled (RBAC protected)
- Monthly compliance reports MUST be generated and archived for high-risk systems

### 3.6 Before/After State in Audit Records (MANDATORY)

All data mutation audit records MUST include:
- `old_values`: Complete state of the record BEFORE the mutation
- `new_values`: Complete state of the record AFTER the mutation
- `changed_fields`: List of fields that changed

These fields MUST exclude RESTRICTED data per C02 §5.3.

```json
{
  "action": "EMPLOYEE_UPDATE",
  "resource_id": "uuid",
  "correlation_id": "uuid",
  "business_unit_id": "uuid",
  "old_values": { "is_active": true, "department": "HR" },
  "new_values": { "is_active": false, "department": "HR" },
  "changed_fields": ["is_active"],
  "timestamp": "utc_iso8601",
  "user_id": "uuid",
  "trace_id": "uuid"
}
```

### 3.7 Audit Log Access Control (MANDATORY)

- Audit logs MUST be readable by authorized compliance/security users only
- Unauthorized access to audit logs is PROHIBITED
- Access to audit logs MUST itself be audit-logged
- Bulk export of audit logs MUST require explicit compliance approval

### 3.8 Audit Log Backup & Recovery (MANDATORY)

- Audit logs MUST be backed up separately from application data
- Audit log backups MUST be encrypted (B09)
- Audit log backup recovery MUST be tested annually
- Backup integrity MUST be verified after each backup cycle

---

## 4. SECURITY & COMPLIANCE

- Audit log tampering = CRITICAL violation
- Missing audit records for mandatory events = CRITICAL compliance violation
- Unauthorized access to audit logs = CRITICAL violation

---

## 5. NON-NEGOTIABLE RULES

- Modifying or deleting audit records = PROHIBITED (CRITICAL)
- Deleting audit records before retention period = PROHIBITED (CRITICAL)
- Missing `old_values`/`new_values` on data mutations = PROHIBITED
- Legal hold records being deleted = PROHIBITED (CRITICAL)
- Unauthorized audit log access = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Immediate escalation + regulatory notification |
| HIGH | Compliance team escalation |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Audit coverage MUST be verified for all mandatory event types
- Before/after state capture MUST be tested for all mutations
- Audit log immutability MUST be tested (attempt UPDATE/DELETE - verify rejection)
- Retention enforcement MUST be tested (records before period retained; beyond period deleted)
- Legal hold MUST be tested (verify records are blocked from deletion)
- Access control on audit logs MUST be verified
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- All mandatory events MUST be audited (see §3.1 list)
- Audit logs are APPEND-ONLY - no modifications ever
- old_values + new_values REQUIRED on all mutations
- Retention periods MUST be enforced and tested
- Legal hold overrides all automated deletion

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE COMPLIANCE REVIEW BOARD APPROVAL.

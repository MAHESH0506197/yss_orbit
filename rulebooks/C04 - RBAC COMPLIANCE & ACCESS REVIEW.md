<!-- yss_orbit\rulebooks\C04 - RBAC COMPLIANCE & ACCESS REVIEW.md -->
# C04 - RBAC COMPLIANCE & ACCESS REVIEW

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B07 (RBAC Authority), C01 (Privacy), C03 (Audit Compliance)
**Governance Role:** Access Review & RBAC Compliance Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Periodic access review obligations, RBAC compliance reporting, excessive privilege review, orphan account management, access certification process, SoD (Segregation of Duties) obligations, RBAC audit trail obligations |
| REFERENCES | B07 (RBAC mechanics), C03 (audit retention for access records), B15 (logging for access events) |
| MUST NOT DUPLICATE | RBAC mechanics (B07), audit implementation (B15), data retention (C03) |

---

## 1. PURPOSE

This rulebook defines **RBAC compliance and access review obligations** for YSS Orbit.

It establishes:
- Periodic access review requirements
- Excessive privilege detection
- Orphan account management
- Segregation of duties requirements
- RBAC compliance audit obligations

All access assignments MUST be periodically reviewed and validated.

---

## 2. SCOPE

Applies to: all user-role assignments, all permission configurations, all BusinessUnit memberships, all admin accounts. No access assignment is exempt from periodic review.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Periodic Access Review (MANDATORY)

Access reviews MUST be conducted on the following schedule:

| Access Type | Review Frequency |
|------------|----------------|
| SUPER_ADMIN / PLATFORM_ADMIN roles | Quarterly |
| GLOBAL data_scope roles | Quarterly |
| Regular user-role assignments | Semi-annually |
| Service accounts and system users | Semi-annually |
| Inactive user accounts (no login > 90 days) | Monthly |

Rules:
- Reviews MUST be documented with reviewer name, date, and outcome
- Unauthorized access discovered during review MUST be revoked immediately
- Review results MUST be archived for compliance audit

### 3.2 Least Privilege Enforcement (MANDATORY)

- Users MUST hold ONLY the permissions required for their role responsibilities
- Excess permissions MUST be revoked
- Temporary elevated permissions MUST have an expiry and MUST be reviewed
- Permanent grants of elevated permissions require Architecture + Security review

### 3.3 Orphan Account Management (MANDATORY)

An orphan account is any account that:
- Has no active BusinessUnit membership
- Has had no login in the past 90 days
- Belongs to a terminated or inactive employee

Rules:
- Orphan accounts MUST be identified in monthly automated scans
- Orphan accounts MUST be disabled within 7 days of identification
- Orphan accounts MUST be reviewed before deactivation to prevent operational disruption
- Deactivation MUST be audit-logged

### 3.4 Segregation of Duties (MANDATORY)

The following role combinations MUST NOT be assigned to the same user:

| Prohibited Combination | Risk |
|----------------------|-----|
| PAYROLL_MANAGE + PAYROLL_APPROVE | Self-approval of payroll fraud |
| USER_ADMIN + AUDIT_VIEW | Covering access changes via audit manipulation |
| BILLING_MANAGE + BILLING_APPROVE | Self-approval of billing fraud |
| DATA_EXPORT + DATA_DELETE | Exfiltrate then destroy evidence |

SoD violations MUST be:
- Blocked at role assignment time (enforcement in B07)
- Flagged in periodic access reviews
- Reported to Security Lead for immediate resolution

### 3.5 Admin Account Hygiene (MANDATORY)

- Admin accounts MUST require MFA (enforced by B06)
- Admin accounts MUST be reviewed quarterly
- Admin accounts MUST have dedicated admin-only login credentials
- Admin accounts MUST NOT be shared between users
- Shared admin accounts are PROHIBITED

### 3.6 Service Account Governance (MANDATORY)

- Service accounts MUST have the minimum required permissions
- Service account permissions MUST be reviewed semi-annually
- Service accounts MUST NOT be used for human access
- Service account credentials MUST be rotated at minimum annually

### 3.7 Access Certification Process (MANDATORY)

Annually, all user-role assignments MUST undergo formal certification:

1. Each BusinessUnit owner MUST certify the access list for their BusinessUnit
2. Security Lead MUST certify GLOBAL and admin role assignments
3. Uncertified access MUST be revoked
4. Certification results MUST be archived for 5 years

### 3.8 RBAC Audit Trail (MANDATORY)

All access changes MUST be audit-logged with (governed by B15):
- Who made the change
- What access was granted or revoked
- When the change occurred
- What was the previous state

Access changes without audit trail = CRITICAL compliance violation.

### 3.9 Compliance Reporting (MANDATORY)

Monthly compliance reports MUST include:
- Total active users per BusinessUnit
- Users with GLOBAL scope access
- Newly granted and revoked access in the period
- SoD violations detected and resolved
- Orphan accounts identified and disabled
- Access review completion status

Reports MUST be accessible to: Security Lead, Compliance Officer, Platform Admin.

---

## 4. SECURITY & COMPLIANCE

- Unauthorized access = CRITICAL violation
- SoD violation = HIGH violation
- Orphan accounts active beyond 90+7 days = HIGH violation
- Unreviewed admin access = HIGH violation

---

## 5. NON-NEGOTIABLE RULES

- Missing periodic access review = PROHIBITED
- Uncertified access after annual certification window = PROHIBITED
- Shared admin accounts = PROHIBITED
- SoD-violating role combinations = PROHIBITED
- Access changes without audit trail = CRITICAL violation
- Orphan accounts not disabled within 7 days of identification = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Immediate escalation + access revocation |
| HIGH | Compliance team escalation + 48h remediation |
| MEDIUM | Fix required within next review cycle |

---

## 7. TESTING REQUIREMENTS

- Access review process MUST be tested end-to-end
- SoD enforcement MUST be tested (attempt prohibited role combination - verify rejection)
- Orphan account detection MUST be tested
- Admin MFA enforcement MUST be tested
- RBAC audit trail MUST be tested for all access changes
- Certification process MUST be documented and testable
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Access reviews are MANDATORY on a scheduled cadence
- Least privilege is ENFORCED - excess permissions MUST be revoked
- Orphan accounts MUST be disabled within 7 days
- SoD violations are PROHIBITED at assignment time
- All access changes MUST be audit-logged

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE COMPLIANCE REVIEW BOARD APPROVAL.

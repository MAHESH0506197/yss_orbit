<!-- yss_orbit\rulebooks\C02 - DATA CLASSIFICATION & HANDLING POLICY.md -->
# C02 - DATA CLASSIFICATION & HANDLING POLICY

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B09 (Data Security), C01 (Privacy Framework)
**Governance Role:** Data Classification Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Data classification levels, handling requirements per classification, labeling obligations, access control requirements per classification, transmission requirements, disposal requirements, PII taxonomy |
| REFERENCES | B09 (encryption per classification), C01 (privacy obligations), B15 (logging restrictions per classification) |
| MUST NOT DUPLICATE | Encryption mechanics (B09), retention policy (C01), audit log format (B15) |

---

## 1. PURPOSE

This rulebook defines the **data classification framework** for YSS Orbit.

It establishes:
- Data classification levels
- Handling requirements per classification
- PII taxonomy
- Access controls per classification

All data MUST be classified before collection, storage, or processing.

---

## 2. SCOPE

Applies to: all data collected, stored, or processed by the platform - including tenant data, user data, audit records, system logs, and third-party data. No data is exempt from classification.

---

## 3. CLASSIFICATION LEVELS

### LEVEL 1 - PUBLIC

**Definition:** Data intentionally made public with no confidentiality requirement.

| Property | Value |
|----------|-------|
| Examples | Public-facing product names, published company names |
| Encryption at Rest | Not required |
| Encryption in Transit | HTTPS (standard) |
| Access Control | None required |
| Logging | Standard application logs |
| Retention | As required for business purpose |

### LEVEL 2 - INTERNAL

**Definition:** Internal business data not intended for public disclosure.

| Property | Value |
|----------|-------|
| Examples | Business unit configurations, internal reports, system settings |
| Encryption at Rest | REQUIRED |
| Encryption in Transit | HTTPS REQUIRED |
| Access Control | RBAC enforced |
| Logging | Standard application + audit logs |
| Retention | Per business and compliance requirements |

### LEVEL 3 - CONFIDENTIAL

**Definition:** Sensitive personal or business data requiring strong protection.

| Property | Value |
|----------|-------|
| Examples | Employee personal data, payroll amounts, attendance records, leave records, financial data |
| Encryption at Rest | REQUIRED (AES-256 or equivalent) |
| Encryption in Transit | HTTPS + TLS 1.2+ REQUIRED |
| Access Control | RBAC enforced - need-to-know principle |
| Logging | Audit log REQUIRED for all access and mutations |
| Retention | Per C01 retention policy |
| API Exposure | Explicit field selection - no default full-field responses |

### LEVEL 4 - RESTRICTED

**Definition:** Highest sensitivity data - legal, security-critical, or regulatory exposure.

| Property | Value |
|----------|-------|
| Examples | Authentication credentials, access tokens, CSRF tokens, encryption keys, national ID numbers, payment card data, breach evidence, audit investigation data |
| Encryption at Rest | REQUIRED - additional layer if feasible |
| Encryption in Transit | HTTPS + TLS 1.2+ REQUIRED |
| Access Control | RBAC enforced - minimum necessary access only |
| Logging | Full audit trail REQUIRED - access and all mutations |
| Retention | Per C01 - minimum required period only |
| API Exposure | PROHIBITED in any API response |
| Logging Restriction | PROHIBITED in any log file |
| Masking | REQUIRED for any display context |

---

## 4. PII TAXONOMY

The following data fields are classified as PII and MUST be handled as CONFIDENTIAL or RESTRICTED:

| Field | Classification |
|-------|--------------|
| Full name | CONFIDENTIAL |
| Email address | CONFIDENTIAL |
| Phone number | CONFIDENTIAL |
| Home address | CONFIDENTIAL |
| Date of birth | CONFIDENTIAL |
| Aadhaar number / National ID | RESTRICTED |
| PAN number | RESTRICTED |
| Bank account number | RESTRICTED |
| Salary / payroll amount | CONFIDENTIAL |
| Biometric data | RESTRICTED |
| Medical records | RESTRICTED |
| Authentication passwords | RESTRICTED |
| Access / refresh tokens | RESTRICTED |

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Classification Before Use (MANDATORY)

- All data MUST be explicitly classified before collection, storage, or processing begins
- Unclassified data MUST NOT be processed
- Classification MUST be documented in the data dictionary or schema

### 5.2 API Response Controls by Classification (MANDATORY)

| Classification | API Response Behavior |
|--------------|----------------------|
| PUBLIC | May be returned directly |
| INTERNAL | Requires RBAC authentication |
| CONFIDENTIAL | Requires RBAC + explicit field selection |
| RESTRICTED | PROHIBITED in any API response |

### 5.3 Logging Restrictions by Classification (MANDATORY)

| Classification | Log Behavior |
|--------------|-------------|
| PUBLIC | Standard logging allowed |
| INTERNAL | Field-level logging (no bulk dump) |
| CONFIDENTIAL | Log resource_id only (no field values) |
| RESTRICTED | PROHIBITED in logs - use opaque UUIDs only |

**Violation:** RESTRICTED data in logs = CRITICAL compliance breach.

### 5.4 Data Masking (MANDATORY)

CONFIDENTIAL and RESTRICTED data MUST be masked when displayed:
- Full field value display in UI requires explicit permission
- Partial masking REQUIRED for all lower-permission contexts

Masking examples:
```text
Email:   j***@example.com
Phone:   ****-***-7890
Aadhaar: ****-****-1234
Salary:  ₹**,***
```

### 5.5 Field Selection in Queries (MANDATORY)

- Queries for CONFIDENTIAL or RESTRICTED fields MUST use explicit field selection
- `SELECT *` is PROHIBITED for tables containing CONFIDENTIAL or RESTRICTED data (see B10 §3.1)

### 5.6 Data Transfer Controls (MANDATORY)

- RESTRICTED data MUST NOT be transferred to third parties without explicit approval
- CONFIDENTIAL data MUST be encrypted in transit and anonymized for non-production use
- Cross-border transfers MUST follow C01 §4.9

---

## 6. NON-NEGOTIABLE RULES

- Unclassified data processing = PROHIBITED
- RESTRICTED data in API responses = PROHIBITED (CRITICAL)
- RESTRICTED data in logs = PROHIBITED (CRITICAL)
- Unmasked RESTRICTED data in UI = PROHIBITED
- Unencrypted CONFIDENTIAL or RESTRICTED data at rest = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Immediate escalation + regulatory review |
| HIGH | Escalation to compliance team |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- Data classification MUST be documented for all tables
- RESTRICTED fields MUST NOT appear in API response tests
- RESTRICTED fields MUST NOT appear in log verification tests
- Masking MUST be tested for all CONFIDENTIAL/RESTRICTED fields
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- All data classified as: PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED
- RESTRICTED data MUST NEVER appear in logs or API responses
- CONFIDENTIAL data MUST be explicitly selected, encrypted, and masked
- PII taxonomy defined - all PII is CONFIDENTIAL or RESTRICTED

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE COMPLIANCE REVIEW BOARD APPROVAL.

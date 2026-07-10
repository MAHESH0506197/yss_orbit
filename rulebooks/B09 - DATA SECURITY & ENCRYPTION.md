<!-- yss_orbit\rulebooks\B09 - DATA SECURITY & ENCRYPTION.md -->
# B09 - DATA SECURITY & ENCRYPTION

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B08 (Database Design)
**Governance Role:** Data Security Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Encryption at rest, encryption in transit, password hashing standards, key management, data minimization, data masking, tokenization, secrets management, backup encryption, PII protection standards |
| REFERENCES | B01 (soft delete, audit), B07 (RBAC for data access), B15 (secure logging), C01 (compliance obligations), C02 (data classification) |
| MUST NOT DUPLICATE | Data classification levels (C02), retention policy (C01), audit log format (B15) |

---

## 1. PURPOSE

This rulebook defines **data security and encryption standards** for YSS Orbit.

It establishes:
- Protection of sensitive data at all stages
- Encryption requirements
- Secure data handling practices
- Compliance with data protection standards

All sensitive data MUST be protected according to these rules.

---

## 2. SCOPE

Applies to: all stored data (database, files, backups), data in transit (APIs, integrations), data processing within the system, logs and monitoring data. No data is exempt.

---

## 3. DEFINITIONS

| Term | Definition |
|------|-----------|
| Sensitive Data | Data requiring protection (PII, credentials, tokens, financial data) |
| Encryption at Rest | Data encryption when stored on disk or in database |
| Encryption in Transit | Data encryption during transmission (HTTPS/TLS) |
| Hashing | One-way transformation (e.g., passwords) - NOT reversible |
| Key Management | Secure creation, storage, rotation, and retirement of encryption keys |
| PII | Personally Identifiable Information |
| Tokenization | Replacing sensitive data with a non-sensitive surrogate token |

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Encryption at Rest (MANDATORY)

- Sensitive data MUST be encrypted at rest
- Strong algorithms MUST be used: AES-256 (or equivalent approved standard)
- Unencrypted sensitive data storage is PROHIBITED
- Database-level encryption MUST be enabled in production
- Backup data MUST be encrypted (see §4.10)

### 4.2 Encryption in Transit (MANDATORY)

- All data in transit MUST use HTTPS (TLS 1.2 or higher)
- Plain HTTP is PROHIBITED in staging and production environments
- Internal service communication MUST also be encrypted
- Certificate validation MUST NOT be disabled

### 4.3 Password Security (MANDATORY)

- Passwords MUST be hashed using Argon2 (preferred) or bcrypt (minimum 12 rounds)
- Reversible encryption for passwords is PROHIBITED
- Plain-text password storage is PROHIBITED
- Password comparison MUST use constant-time comparison to prevent timing attacks

### 4.4 Key Management (MANDATORY)

- Encryption keys MUST be securely stored in an approved vault or KMS
- Keys MUST NOT be stored in source code
- Keys MUST NOT be stored in version control
- Key rotation MUST be supported and scheduled
- Retired keys MUST be securely destroyed per approved procedure
- Key access MUST be restricted and audited

### 4.5 Data Minimization (MANDATORY)

- Only required data MUST be collected
- Storing unnecessary sensitive data is PROHIBITED
- Data collected MUST have a defined, documented purpose
- PII MUST NOT be retained beyond its defined retention period (governed by C01)

### 4.6 Data Masking (MANDATORY)

- Sensitive data MUST be masked when displayed in UI, logs, and reports
- Full exposure of sensitive fields is PROHIBITED in non-privileged contexts

Masking examples:
```text
Credit card:  ****-****-****-1234
Phone:        ****-***-7890
Email:        j***@example.com
```

### 4.7 Tokenization (MANDATORY)

Highly sensitive data MUST be tokenized. Direct storage of raw critical identifiers is PROHIBITED for:
- Payment identifiers and card data
- External system credentials
- High-risk PII (e.g., national ID numbers)

### 4.8 Secrets Management (MANDATORY)

- Secrets MUST be stored in environment variables or secure vaults (AWS Secrets Manager, HashiCorp Vault, or equivalent)
- Hardcoded secrets in source code are PROHIBITED
- Secrets in version control are PROHIBITED (including `.env.production` files)
- Secret rotation MUST be supported
- Leaked secrets MUST trigger immediate rotation and incident response

### 4.9 Logging Restrictions (MANDATORY)

Sensitive data MUST NOT appear in application logs or audit logs:
- Passwords or password hashes
- Access or refresh tokens
- CSRF tokens
- Full PII (names, emails, phone numbers, addresses)
- Payment card data
- Any RESTRICTED data per C02

Audit logs MUST use opaque UUIDs only - resolution to PII happens via DB lookup.

### 4.10 Backup Security (MANDATORY)

- Backups MUST be encrypted using the same standards as production data (§4.1)
- Backup encryption keys MUST be stored separately from the backup data
- Backup access MUST be restricted via RBAC
- Unencrypted backups are PROHIBITED

### 4.11 Access Control (MANDATORY)

- Access to sensitive data MUST be restricted via RBAC (B07)
- Least-privilege access MUST be enforced
- Unauthorized access to sensitive data MUST be blocked and logged

### 4.12 Data Retention (MANDATORY)

- Data MUST be retained only for the period defined in C01 §5.7
- Data MUST be securely deleted or anonymized after its retention period expires
- Automated retention enforcement is REQUIRED
- Retention policy bypass is PROHIBITED

### 4.13 Sensitive Field Protection in API Responses (MANDATORY)

API responses MUST NEVER include:
```text
password_hash
reset_token
reset_expiry
failed_login_attempts
is_locked
raw encryption keys
internal system flags
access_token or refresh_token values
```

Service Layer MUST explicitly select only safe fields when constructing DTOs.

### 4.14 Timing Attack Prevention (MANDATORY)

- Operations that depend on sensitive comparisons (token validation, password check) MUST use constant-time comparison
- Early-exit comparisons on security-critical paths are PROHIBITED

---

## 5. SECURITY & COMPLIANCE

- Data MUST be protected at all stages: at rest, in transit, and during processing
- Data exposure is a CRITICAL security breach
- Weak encryption is PROHIBITED
- Unauthorized access to sensitive data MUST be rejected and logged
- Compliance with DPDP (India) and GDPR-style principles REQUIRED (C01)

### Audit Logging

Access to sensitive data MUST be logged:
```json
{
  "user_id": "uuid",
  "action": "SENSITIVE_DATA_ACCESS",
  "resource": "PII_FIELD",
  "trace_id": "uuid",
  "timestamp": "utc_iso8601"
}
```

---

## 6. NON-NEGOTIABLE RULES

- Unencrypted sensitive data storage = PROHIBITED
- Logging sensitive data (passwords, tokens, PII) = PROHIBITED
- Hardcoded secrets = PROHIBITED
- Weak encryption (MD5, SHA1 for passwords, DES) = PROHIBITED
- Plain HTTP in production = PROHIBITED
- Reversible password storage = PROHIBITED
- Unencrypted backups = PROHIBITED
- Sensitive fields in API responses = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

Non-compliant systems MUST NOT be deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- Encryption at rest MUST be verified in production config tests
- Secure transmission (HTTPS) MUST be verified
- Password hashing MUST be tested (verify not plain text)
- Access control MUST be tested
- Logging sanitization MUST be validated (no PII, no tokens)
- Backup encryption MUST be tested
- Sensitive field exclusion from API responses MUST be tested
- Timing attack resistance MUST be tested for security-critical comparisons
- Any failing test MUST block deployment

---

## 9. QUICK SUMMARY

- All sensitive data MUST be encrypted at rest and in transit
- Passwords MUST use Argon2 or bcrypt - never reversible
- Secrets MUST be in vaults or env vars - never in code
- PII MUST NOT appear in logs - use opaque UUIDs
- Sensitive fields MUST NOT appear in API responses
- Backup data MUST be encrypted

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

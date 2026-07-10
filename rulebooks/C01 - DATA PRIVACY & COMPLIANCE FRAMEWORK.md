<!-- yss_orbit\rulebooks\C01 - DATA PRIVACY & COMPLIANCE FRAMEWORK.md -->
# C01 - DATA PRIVACY & COMPLIANCE FRAMEWORK

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B09 (Data Security), B15 (Audit Implementation)
**Governance Role:** Privacy & Compliance Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Legal privacy obligations, DPDP (India) alignment, GDPR-style principles, consent governance, data subject rights obligations, breach notification obligations, data minimization policy, legal retention obligations, cross-border data transfer restrictions |
| REFERENCES | B09 (encryption implementation), B15 (audit implementation), C02 (data classification), C03 (audit compliance), C04 (RBAC compliance) |
| MUST NOT DUPLICATE | Encryption mechanics (B09), audit log implementation (B15), data classification details (C02) |

---

## 1. PURPOSE

This rulebook defines **data privacy and compliance obligations** for YSS Orbit.

It establishes:
- Legal compliance framework
- Data protection principles
- Consent and privacy rights management
- Breach notification obligations

All data operations MUST comply with these obligations.

---

## 2. SCOPE

Applies to: all personal data collection, storage, processing, and transmission, all tenant data, all user data. No data operation is exempt.

---

## 3. APPLICABLE REGULATORY FRAMEWORK

The platform MUST comply with:
- **DPDP Act 2023** (India - Digital Personal Data Protection Act)
- **GDPR-style principles** (as applicable for international tenants)
- **IT Act 2000** (India - Information Technology Act, as applicable)

---

## 4. CORE GOVERNANCE LAWS

### 4.1 Lawful Basis for Processing (MANDATORY)

All personal data processing MUST have a documented, lawful basis:

| Lawful Basis | Example Usage |
|-------------|--------------|
| **Consent** | Marketing communications, non-essential data collection |
| **Contract** | Employee payroll, attendance management |
| **Legal Obligation** | Tax compliance, statutory filings |
| **Legitimate Interest** | Platform security, fraud prevention |

Processing without a documented lawful basis is PROHIBITED.

### 4.2 Data Minimization (MANDATORY)

- Only personal data strictly required for the stated purpose MUST be collected
- Collecting personal data beyond the stated purpose is PROHIBITED
- Every collected field MUST have a documented purpose

### 4.3 Purpose Limitation (MANDATORY)

- Personal data MUST only be used for the purpose it was collected
- Processing personal data for incompatible purposes is PROHIBITED
- Purpose changes MUST require fresh consent or a new lawful basis

### 4.4 Consent Management (MANDATORY)

- Consent MUST be freely given, specific, informed, and unambiguous
- Pre-ticked consent boxes are PROHIBITED
- Consent records MUST be stored with: timestamp, data subject ID, version of consent text, scope, channel
- Withdrawal of consent MUST be as easy as granting it
- Consent withdrawal MUST be processed within 30 days

### 4.5 Data Subject Rights (MANDATORY)

The following rights MUST be supported:

| Right | Obligation |
|-------|-----------|
| Right to Access | Provide copy of data within 30 days |
| Right to Correction | Correct inaccurate data within 30 days |
| Right to Erasure | Delete/anonymize personal data upon valid request |
| Right to Data Portability | Export data in machine-readable format |
| Right to Object | Stop processing based on consent |

Requests MUST be tracked, responded to within regulatory deadlines, and audited.

### 4.6 Data Retention (MANDATORY)

- Personal data MUST be retained for no longer than required for its stated purpose plus the applicable legal retention period
- Automated retention enforcement is REQUIRED
- Retention periods MUST be documented per data category
- Data beyond retention period MUST be deleted or anonymized

| Data Category | Minimum Retention | Maximum Retention |
|--------------|------------------|------------------|
| Payroll records | 7 years (statutory) | 10 years |
| Employee personal data | Duration of employment + 5 years | 7 years |
| Audit logs | 5 years | 10 years |
| Application logs | 30 days | 90 days |
| Login/session data | 90 days | 1 year |

### 4.7 Data Deletion & Anonymization (MANDATORY)

- When personal data must be deleted, EITHER physical deletion OR irreversible anonymization is REQUIRED
- Soft-delete alone is NOT sufficient for data subject erasure requests - anonymization of PII fields is REQUIRED
- Anonymization MUST be irreversible

Anonymization example:
```python
def anonymize_user(user_id: str) -> None:
    User.objects.filter(id=user_id).update(
        email=f"deleted_{uuid.uuid4().hex[:8]}@deleted.invalid",
        first_name="Deleted",
        last_name="User",
        phone="",
        is_active=False,
        is_deleted=True,
        deleted_at=now(),
    )
```

### 4.8 Breach Notification (MANDATORY)

In the event of a data breach:
- Regulatory authority MUST be notified within 72 hours of discovering the breach
- Affected data subjects MUST be notified without undue delay if the breach poses a high risk to their rights
- Breach notifications MUST include: nature of breach, categories and approximate number of affected data subjects, likely consequences, measures taken
- All breach events MUST be documented in the incident log

### 4.9 Cross-Border Data Transfer (MANDATORY)

- Personal data MUST NOT be transferred outside India without adequate safeguards unless explicitly permitted by DPDP Act provisions
- Cross-border transfers MUST be documented and reviewed for compliance
- Integration with foreign services MUST be assessed for data transfer compliance
- Tenant data residency requirements MUST be respected

### 4.10 Privacy by Design (MANDATORY)

- Privacy considerations MUST be incorporated during system design - not retrofitted
- New features collecting or processing personal data MUST undergo a privacy impact review before development begins
- Privacy impact reviews MUST be documented and archived

### 4.11 Vendor & Processor Management (MANDATORY)

- Third-party data processors (cloud providers, integrations) MUST have signed Data Processing Agreements (DPAs)
- Processor access to personal data MUST be restricted to what is necessary
- Processor security posture MUST be reviewed annually

---

## 5. SECURITY & COMPLIANCE

- Compliance violations are CRITICAL
- Data breach without notification = CRITICAL violation
- Processing without lawful basis = CRITICAL violation
- Missing consent records = CRITICAL violation

---

## 6. NON-NEGOTIABLE RULES

- Processing without lawful basis = PROHIBITED (CRITICAL)
- Data collection beyond stated purpose = PROHIBITED
- Cross-border transfer without safeguards = PROHIBITED
- Breach without notification within 72 hours = PROHIBITED
- Missing consent records = PROHIBITED
- PII beyond retention period without deletion/anonymization = PROHIBITED

---

## 7. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Immediate escalation + regulatory review |
| HIGH | Escalation to compliance team |
| MEDIUM | Fix required |

---

## 8. TESTING REQUIREMENTS

- Consent capture and withdrawal MUST be tested
- Data subject rights workflows MUST be tested
- Retention enforcement MUST be tested
- Anonymization MUST be tested (verify irreversibility)
- Cross-border transfer controls MUST be validated
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE COMPLIANCE REVIEW BOARD APPROVAL.

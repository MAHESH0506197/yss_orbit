# YSS Orbit — Data Privacy & DPDP Act Compliance

> **Regulation**: India's Digital Personal Data Protection Act 2023 (DPDP Act)
> **Scope**: Employee personal data processed by YSS Orbit HRMS
> **Data Controller**: Tenant organization (employer)
> **Data Processor**: YSS Orbit (SaaS platform)

---

## 1. Categories of Personal Data Processed

### Sensitive Personal Data (Requires explicit consent)

| Category | Fields | Legal Basis |
|----------|--------|-------------|
| Biometric | Fingerprint (if attendance hardware) | Explicit consent + employment contract |
| Financial | Bank account, PAN, salary details | Employment necessity |
| Health | ESI enrollment, disability records | Employment law compliance |
| Identity | Aadhaar, passport number | Income Tax Act, verification |
| Religious | (if applicable for leave policies) | Not collected by default |

### Non-Sensitive Personal Data

| Category | Fields | Legal Basis |
|----------|--------|-------------|
| Contact | Phone, email, address | Employment contract |
| Professional | Designation, department, experience | Employment operations |
| Performance | Appraisal ratings, feedback | Legitimate employment interest |
| Attendance | Check-in/out times, leave records | Employment law + payroll |
| Payroll | Gross salary, deductions, TDS | IT Act, PF Act, ESI Act |

---

## 2. Data Subject Rights (DPDP Act Chapter III)

### 2.1 Right to Information

Employees can request what data is stored:

```
GET /api/v1/hrms/employees/{id}/data-export/
Authorization: Bearer <token>

Response: Complete JSON export of all personal data fields
```

**Processing time**: Within 30 days of request.

### 2.2 Right to Correction

Employees can correct inaccurate data:

```
PATCH /api/v1/hrms/employees/{id}/
{
  "personal_email": "corrected@email.com",
  "emergency_contact_name": "Corrected Name"
}
```

HR Admin must approve corrections to official fields (name, date of birth, PAN).

### 2.3 Right to Erasure (Right to be Forgotten)

**Note**: Full erasure is limited by legal retention requirements.

```
POST /api/v1/hrms/employees/{id}/gdpr-erasure/
{
  "reason": "Employee request post-exit",
  "retain_financial": true,   // Required for IT Act compliance
  "retain_statutory": true    // Required for PF/ESI compliance
}
```

**What gets erased (post-7-year retention)**:
- Profile photo
- Personal email, phone number
- Emergency contact details
- Home address
- Non-essential comments

**What is retained (legal requirement)**:
- Payslips (7 years — IT Act)
- PF contribution records (permanent — EPFO)
- ESI records (permanent — ESIC)
- Tax declarations (7 years — IT Act)

### 2.4 Right to Withdraw Consent

For consent-based processing (biometric, optional data):

```
POST /api/v1/hrms/employees/{id}/consent/withdraw/
{
  "consent_type": "biometric_attendance"
}
```

---

## 3. Data Localization (DPDP Act Section 16)

**Requirement**: Personal data of Indian citizens must be stored in India.

### Production Deployment Requirements

```
Primary Region: ap-south-1 (Mumbai) OR ap-southeast-1 (Singapore)
Database: Must be in India (AWS RDS ap-south-1)
Backups: Must be in India
CDN: Edge caching allowed globally; origin must be India

❌ DO NOT store personal data in:
   - US East/West regions
   - Europe regions
   - Without explicit data transfer agreement
```

### Cross-Border Transfer Restrictions

If any employee data must leave India:

1. Obtain explicit employee consent
2. Ensure destination country has adequate data protection laws
3. Execute Standard Contractual Clauses (SCCs)
4. Document in the Data Register

---

## 4. Consent Management

### Consent Collection Points

| Event | Data Collected | Consent Type |
|-------|---------------|--------------|
| Employee onboarding | All HR data | Employment contract (deemed) |
| Biometric enrollment | Fingerprint/face | Explicit (written) |
| External background check | Identity documents | Explicit (written) |
| Training recordings | Video/audio | Explicit (written) |
| GPS tracking (field staff) | Location | Explicit (in-app) |

### Consent Storage

```python
# apps/hrms/models/employee.py
class EmployeeConsent(TenantModel):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    consent_type = models.CharField(max_length=50)  # BIOMETRIC, GPS, RECORDING
    consented_at = models.DateTimeField()
    consent_ip = models.GenericIPAddressField(null=True)
    withdrawn_at = models.DateTimeField(null=True)
    withdrawal_reason = models.TextField(blank=True)
```

---

## 5. Audit Trail & Accountability

### What is Logged

Every access to personal data is logged in `AuditLog`:

```python
# What gets audited (automatic via AuditMiddleware)
- View employee profile: ACTION=VIEW, entity=Employee
- Update salary: ACTION=UPDATE, entity=SalaryStructure
- Access payslip: ACTION=VIEW, entity=Payslip
- Export data: ACTION=EXPORT, entity=Employee
- Download report: ACTION=DOWNLOAD, entity=PayrollRun
```

### Audit Log Retention

```
Audit logs: 5 years (DPDP Act compliance)
Never deleted, only archived to cold storage after 2 years
```

### Data Access Report (for DPO)

```python
# Generate monthly data access report
from apps.audit.models import AuditLog
from django.db.models import Count

report = AuditLog.objects.filter(
    created_at__month=6,
    created_at__year=2026
).values('action', 'entity_type').annotate(count=Count('id'))
```

---

## 6. Security Measures

### Encryption

| Data | Encryption | Notes |
|------|-----------|-------|
| PAN number | AES-256 at rest | Django-encrypted-fields |
| Bank account | AES-256 at rest | Django-encrypted-fields |
| Aadhaar (last 4) | Stored as-is | Only last 4 digits stored |
| Passwords | bcrypt (Django default) | Never stored in plain text |
| Data in transit | TLS 1.3 | Enforced by nginx |
| DB backup | AES-256 | S3 server-side encryption |

### Access Control (RBAC)

```
Super Admin: Full access to all tenants
Platform Admin: Tenant administration only
HR Admin: Employee data for their BU only
Manager (MSS): Own team data only
Employee (ESS): Own data only

Tenant isolation enforced at model level:
TenantModel.save() → validates business_unit_id
TenantModel.objects → filter(business_unit_id=<current_bu>)
```

---

## 7. Breach Notification Procedure

**DPDP Act requirement**: Notify Data Protection Board within 72 hours of becoming aware of a breach.

### Step 1: Detect & Contain

```
1. Isolate affected systems
2. Revoke compromised credentials
3. Preserve evidence (do NOT delete logs)
4. Notify security@yss-orbit.com immediately
```

### Step 2: Assess Scope

```
Determine:
- How many data subjects affected?
- What categories of data compromised?
- What was the likely cause?
- Is ongoing risk present?
```

### Step 3: Notify Authorities

```
Notify within 72 hours:
- India Data Protection Board (when operational)
- CERT-In (if cyberattack)
- SEBI/RBI (if financial data, if applicable)
```

### Step 4: Notify Data Subjects

```
Notify affected employees within 72 hours:
- What happened
- What data was involved
- What they should do
- Contact for questions
```

---

## 8. Data Protection Officer (DPO)

**DPDP Act Section 8**: Significant data fiduciaries must appoint a DPO.

| Role | Contact |
|------|---------|
| DPO | `dpo@<tenant-domain>.com` |
| Security Lead | `security@yss-orbit.com` |
| Platform Privacy | `privacy@yss-orbit.com` |

DPO responsibilities:
- Annual privacy impact assessment
- Employee privacy training
- Third-party vendor data processing agreements
- Responding to Data Subject requests within 30 days

---

## 9. Third-Party Data Processors

| Processor | Data Shared | Safeguard |
|-----------|-------------|-----------|
| EPFO (PF filing) | Employee UAN, PF amounts | Statutory requirement |
| ESIC (ESI filing) | IP number, contributions | Statutory requirement |
| IT Dept (TDS) | PAN, salary, TDS | Statutory requirement |
| Bank (salary transfer) | Account, IFSC, amount | Employment contract |
| Background verification | Identity documents | Written consent |
| Email provider | Email address | DPA in place |

All third-party processors must have a **Data Processing Agreement (DPA)** in place.

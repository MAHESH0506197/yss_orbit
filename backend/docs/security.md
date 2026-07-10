# YSS Orbit — Security Guide

> **Audience:** Security engineers, Backend developers, Compliance
> **Covers:** PII handling, RBAC, Audit logging, Authentication, Data protection

---

## 1. Authentication & Authorization

### 1.1 JWT Authentication
- **Algorithm:** `HS256` (configurable to `RS256` for enterprise)
- **Access token TTL:** 15 minutes
- **Refresh token TTL:** 7 days (stored in HttpOnly cookie — NOT accessible to JavaScript)
- **Token storage:** Tokens are **never** stored in `localStorage` or `sessionStorage`

```python
# config/settings/base.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 1.2 RBAC (Role-Based Access Control)
Every API view is guarded by `PermissionGate` using Django REST Framework's `IsAuthenticated` + custom `HasPermission` classes.

**Permission naming convention:** `{app}.{resource}.{action}`
- Examples: `hrms.employees.create`, `payroll.runs.approve`, `hrms.leave.approve`

**RBAC Enforcement rules:**
1. **Never trust the frontend** — all permission checks happen server-side
2. **Business Unit isolation** — every queryset filters by `business_unit_id` from the JWT claim
3. **Super admin bypass** — `isSuperAdmin=True` in JWT claims grants all permissions (only platform admins)

```python
# Example view with RBAC
class LeaveApprovalView(APIView):
    permission_classes = [IsAuthenticated, HasPermission('hrms.leave.approve')]

    def post(self, request, pk):
        bu_id = request.user.selected_business_unit_id  # From JWT claim
        # All queries MUST include bu_id
        req = get_object_or_404(LeaveRequest, id=pk, business_unit_id=bu_id)
        ...
```

---

## 2. Tenant Isolation (Multi-Tenancy)

YSS Orbit uses **row-level multi-tenancy** via `TenantModel`:

```python
class TenantModel(BaseModel):
    business_unit_id = models.UUIDField(db_index=True)

    def save(self, *args, **kwargs):
        if not self.business_unit_id:
            raise IntegrityError("business_unit_id is required on all tenant models")
        super().save(*args, **kwargs)
```

**Rules:**
- Every model that stores tenant data MUST inherit `TenantModel`
- Every service method MUST accept and apply `bu_id` to all ORM queries
- **Cross-tenant data access is impossible** via the API (JWT enforces BU scope)
- Violation is a **P0 security incident** — escalate immediately

---

## 3. PII Handling

### 3.1 PII Fields in Employee Model
| Field | Classification | Handling |
|-------|---------------|---------|
| `aadhar_number` | Sensitive PII | Stored encrypted at rest (AES-256) |
| `pan_number` | Sensitive PII | Stored encrypted, partially masked in UI (ABCDE1234F → `ABCDE****F`) |
| `bank_account_number` | Financial PII | Stored encrypted, masked in API responses |
| `email`, `phone` | Contact PII | Stored plaintext, access-controlled |
| `salary`, `ctc` | Financial | Accessible only to HR, Finance roles |
| `address` | PII | Stored plaintext, access-controlled |

### 3.2 API Response Masking
```python
class EmployeeSerializer(serializers.ModelSerializer):
    pan_number = serializers.SerializerMethodField()
    bank_account_number = serializers.SerializerMethodField()

    def get_pan_number(self, obj):
        if not self.context['request'].user.has_perm('hrms.employees.view_sensitive'):
            return f"{obj.pan_number[:5]}****{obj.pan_number[-1]}" if obj.pan_number else None
        return obj.pan_number

    def get_bank_account_number(self, obj):
        if not self.context['request'].user.has_perm('hrms.employees.view_banking'):
            return f"****{obj.bank_account_number[-4:]}" if obj.bank_account_number else None
        return obj.bank_account_number
```

### 3.3 GDPR / Data Retention
- Employee records use **soft delete** (`is_deleted=True`) — never hard-deleted
- On termination: PII fields are **anonymised** after legal hold period (7 years for payroll records per Indian IT Act)
- Right-to-erasure requests: anonymise PII fields; retain aggregate payroll data for statutory compliance

---

## 4. Audit Logging

**Every write operation** creates an immutable audit trail via `AuditModel`:

```python
class AuditModel(BaseModel):
    created_by = models.ForeignKey(User, related_name='+', null=True)
    updated_by = models.ForeignKey(User, related_name='+', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Employee 360 Timeline events** (immutable append-only via `EmployeeEvent`):
- `HIRED`, `PROMOTED`, `TRANSFERRED`, `SALARY_REVISED`, `PAYROLL_PROCESSED`, `LEAVE_APPROVED`, `EXIT_COMPLETED`, etc.
- Records are **never updated or deleted** once created

**Payroll audit trail:**
- `PayrollRun.run_by` — who triggered the run
- `PayrollRun.approved_by` — who approved (HR step)
- `PayrollRun.locked_by` — who locked (Finance step)
- `Payslip.computed_at` — timestamp of computation

---

## 5. API Security Headers

```python
# config/settings/production.py
SECURE_HSTS_SECONDS = 31536000            # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

**Nginx security headers:**
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-{nonce}';" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 6. Rate Limiting

```python
# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '2000/hour',
    }
}
```

**Payroll endpoints get stricter throttling:**
```python
class PayrollGenerateView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'payroll_generate'   # 10/hour per user
```

---

## 7. Secrets Management

| Secret | Storage |
|--------|---------|
| `SECRET_KEY` | AWS Secrets Manager |
| `DATABASE_URL` | AWS Secrets Manager |
| `REDIS_URL` | AWS Secrets Manager |
| `EMAIL_HOST_PASSWORD` | AWS Secrets Manager |
| S3 credentials | IAM instance role (no static credentials) |
| PAN/Aadhaar encryption keys | AWS KMS |

**Rotation schedule:**
- `SECRET_KEY`: Annually (coordinated with maintenance window)
- Database passwords: Every 90 days
- Email API keys: On compromise or annually

---

## 8. Security Incident Response

See `INCIDENT_RESPONSE.md` for the full incident response playbook.

**Immediate actions for data breach:**
1. Revoke all active JWT tokens: `python manage.py shell -c "from rest_framework_simplejwt.token_blacklist.models import OutstandingToken; OutstandingToken.objects.all().delete()"`
2. Rotate `SECRET_KEY` (invalidates all sessions)
3. Rotate database password
4. Notify DPO within 72 hours (GDPR requirement)
5. Investigate access logs

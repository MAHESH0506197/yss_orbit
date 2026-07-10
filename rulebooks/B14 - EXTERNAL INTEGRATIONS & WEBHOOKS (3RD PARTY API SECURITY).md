<!-- yss_orbit\rulebooks\B14 - EXTERNAL INTEGRATIONS & WEBHOOKS (3RD PARTY API SECURITY).md -->
# B14 - EXTERNAL INTEGRATIONS & WEBHOOKS (3RD PARTY API SECURITY)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01, B09 (Data Security), B12 (API Design), B13 (Async & Performance)
**Governance Role:** External Integration Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Outbound API communication standards, inbound webhook validation, HMAC verification, integration secret management, SSRF prevention, webhook idempotency, async webhook processing |
| REFERENCES | B01 (idempotency §5.28, timeout), B09 (secrets), B13 (async processing), B15 (integration audit logging) |
| MUST NOT DUPLICATE | Idempotency full governance (B01 §5.28), secrets management (B09), async task rules (B13) |

---

## 1. PURPOSE

This rulebook defines **secure external integrations and webhook handling** for YSS Orbit.

It establishes:
- Outbound API communication standards
- Inbound webhook validation
- Third-party security controls
- Data exchange safety

All integrations MUST follow these rules.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Outbound Request Security (MANDATORY)

- All external API calls MUST use HTTPS (TLS 1.2+)
- API credentials MUST be stored using B09 secrets management standards
- Hardcoded API keys are PROHIBITED
- All outbound requests MUST have explicit timeouts
- Outbound request URLs MUST be validated - SSRF prevention is REQUIRED

SSRF Prevention (MANDATORY):
- Allowed integration target URLs MUST be whitelisted in configuration
- User-provided URLs that bypass the whitelist MUST be rejected
- Internal network addresses (10.x, 192.168.x, 127.0.0.1) MUST NOT be resolvable via integrations

### 2.2 Webhook Verification (MANDATORY)

All incoming webhooks MUST be verified using HMAC signatures or equivalent secret token validation.

Unverified webhooks are PROHIBITED.

```python
import hmac
import hashlib

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### 2.3 Webhook Idempotency (MANDATORY)

- Webhook processing MUST be idempotent
- Duplicate webhook events MUST NOT cause duplicate effects
- Each webhook event MUST be identified by a unique event ID
- Processed event IDs MUST be stored to prevent re-processing

### 2.4 Webhook Async Processing (MANDATORY)

- Webhook handling MUST be asynchronous (via Celery/task queue per B13)
- Blocking webhook processing in the request lifecycle is PROHIBITED
- Webhook endpoint MUST acknowledge receipt immediately (HTTP 200) and process asynchronously

### 2.5 Retry & Failure Handling (MANDATORY)

- All external calls MUST have timeouts
- Safe retry mechanisms with exponential backoff MUST be implemented
- Infinite retries are PROHIBITED
- External API failures MUST be handled gracefully - system MUST NOT crash

### 2.6 Rate Limiting (MANDATORY)

- External API rate limits MUST be respected
- Excessive request bursts are PROHIBITED
- Rate-limited responses from external APIs MUST be handled with backoff

### 2.7 Tenant Isolation (MANDATORY)

- Integration data MUST respect tenant scope
- Integration jobs MUST carry `business_unit_id` where applicable
- Cross-tenant data leakage via integrations is PROHIBITED

### 2.8 Data Validation (MANDATORY)

- All incoming webhook data MUST be validated before processing
- Invalid payloads MUST be rejected and logged
- External data MUST be treated as untrusted input

### 2.9 Secret Management (MANDATORY)

- Integration secrets MUST be stored per B09 standards
- Secrets MUST NOT be exposed in logs or error responses
- Integration secrets MUST support rotation without system downtime

### 2.10 Logging (MANDATORY)

All integration and webhook activities MUST be logged:
- Outbound: endpoint, status code, duration_ms, trace_id
- Inbound webhook: event_type, event_id, status, trace_id
- Failed verifications: event_type, reason, trace_id

---

### 2.11 API Consumer Key Governance (MANDATORY)

Enterprise tenants on PRO and ENTERPRISE plans MUST be able to create scoped API keys for integrating YSS Orbit APIs into their own systems.

**API Key Schema:**

```sql
CREATE TABLE api_consumer_key (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    created_by       UUID NOT NULL REFERENCES users(id),
    key_id           VARCHAR(32) NOT NULL UNIQUE,
    key_hash         VARCHAR(200) NOT NULL,   -- bcrypt hash - NEVER store plaintext
    name             VARCHAR(200) NOT NULL,
    description      TEXT,
    scopes           TEXT[] NOT NULL,         -- ['hrms.employee.view', 'reports.export.view']
    allowed_ips      INET[],                  -- NULL = any IP; non-NULL = IP whitelist
    rate_limit_rpm   INTEGER NOT NULL DEFAULT 60,
    expires_at       TIMESTAMPTZ,
    last_used_at     TIMESTAMPTZ,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at       TIMESTAMPTZ,
    revoked_by       UUID REFERENCES users(id),
    revocation_reason TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**API Key Format:** `{key_id}_{secret}` - key_id is 16-character alphanumeric (stored), secret is 32-character random (hashed only, shown ONCE at creation).

**Authentication:** `Authorization: ApiKey {key_id}_{secret}` header. Backend looks up by key_id, verifies bcrypt hash using constant-time comparison, checks expiry and IP whitelist.

**Scope Enforcement:** API key scopes are a SUBSET of normal permissions. An API key can only do what its declared scopes allow, regardless of the BusinessUnit's full permission set.

### 2.12 Rate Limiting Architecture (MANDATORY)

Rate limiting MUST use Redis sliding window counter per identifier (`api_key:{key_id}` or `user:{user_id}:{business_unit_id}`).

All API responses - whether succeeded or rate-limited - MUST include:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1718450460
```

Rate-limited requests MUST return `429 Too Many Requests` with `RATE_LIMIT_EXCEEDED` error code.

Default rate limits by plan:

| Consumer Type | Default Limit |
|--------------|---------------|
| Authenticated user (session) | 300 RPM |
| API key - FREE plan | 30 RPM |
| API key - BASIC plan | 60 RPM (up to 120 RPM) |
| API key - PRO plan | 300 RPM (up to 600 RPM) |
| API key - ENTERPRISE plan | 1000 RPM (custom) |
| SUPER_ADMIN | Unlimited |

### 2.13 Webhook Signing (MANDATORY)

**Outbound Webhook Signing** - When YSS Orbit delivers webhooks TO external systems, payloads MUST be signed with HMAC-SHA256. Required delivery headers:
```http
X-YSSOrbit-Signature: sha256={hmac_sha256_signature}
X-YSSOrbit-Event: payroll.generated
X-YSSOrbit-Delivery-Id: {uuid}
X-YSSOrbit-Timestamp: {unix_timestamp}
X-Correlation-Id: {correlation_id}
```

**Inbound Webhook Verification** - When external systems send webhooks TO YSS Orbit, the signature MUST be verified. Requests older than 5 minutes MUST be rejected (replay attack prevention). Signature verification MUST use `hmac.compare_digest` (constant-time).

**Webhook Retry Policy:**
```
Retry 1: 30 seconds after failure
Retry 2: 5 minutes
Retry 3: 30 minutes
Retry 4: 2 hours
Retry 5 (final): 6 hours → mark as 'abandoned', alert tenant ORG_ADMIN
```

The `webhook_delivery` table MUST track: `business_unit_id`, `endpoint_id`, `event_type`, `correlation_id`, `payload`, `status`, `http_status`, `attempt_count`, `next_attempt_at`, `delivered_at`.


## 3. NON-NEGOTIABLE RULES

- Unverified webhook = CRITICAL violation
- Hardcoded API keys = PROHIBITED
- Unvalidated external data = PROHIBITED
- SSRF via unvalidated outbound URLs = CRITICAL violation
- External failure causing system crash = PROHIBITED
- Non-idempotent webhook processing = PROHIBITED
- API key secret stored in plaintext = PROHIBITED (CRITICAL)
- Webhook delivered without HMAC signature = PROHIBITED
- Rate limiting headers missing = PROHIBITED
- API key with broader scopes than declared = PROHIBITED

---

## 4. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 5. TESTING REQUIREMENTS

- Integration flows MUST be tested with mocked external services
- Webhook HMAC verification MUST be tested (valid and invalid signatures)
- Webhook idempotency MUST be tested (duplicate event handling)
- Retry and failure handling MUST be tested
- SSRF prevention MUST be tested
- Any failing test MUST block deployment

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

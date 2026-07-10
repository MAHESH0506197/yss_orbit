<!-- yss_orbit\rulebooks\B12 - API DESIGN STANDARDS (REST, VERSIONING, STRUCTURE).md -->
# B12 - API DESIGN STANDARDS (REST, VERSIONING, STRUCTURE)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B04 (Application Architecture), B10 (ORM & Queries)
**Governance Role:** API Contract Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | REST API structure, request/response consistency, versioning strategy, API reliability rules, idempotency key enforcement, API documentation requirements, API lifecycle governance |
| REFERENCES | B01 (API response envelope §5.3, URL rules §5.18, backward compat §5.19, idempotency §5.28, rate limiting §5.24), X02 (error codes), B07 (authentication/authorization on APIs) |
| MUST NOT DUPLICATE | API response envelope (B01 §5.3), error format (X02), rate limiting specifics (B01 §5.24), idempotency full governance (B01 §5.28) |

---

## 1. PURPOSE

This rulebook defines **API design and behavior standards** for YSS Orbit.

It establishes:
- REST API structure
- Request/response consistency
- Versioning strategy
- API reliability rules

All APIs MUST follow these standards.

---

## 2. SCOPE

Applies to: all backend APIs (internal and external), all endpoints and routes, all request and response structures. No API is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 URL Structure (MANDATORY)

All API endpoints MUST follow:

```text
/api/v1/{resources}/
/api/v1/{resources}/{id}/
/api/v1/{resources}/{id}/{sub-resources}/
```

Standard HTTP method mapping:
```text
GET    /api/v1/{resources}/        → list
POST   /api/v1/{resources}/        → create
GET    /api/v1/{resources}/{id}/   → retrieve
PATCH  /api/v1/{resources}/{id}/   → partial update
PUT    /api/v1/{resources}/{id}/   → full replace (when supported)
DELETE /api/v1/{resources}/{id}/   → soft delete
```

Rules:
- URLs MUST use plural, kebab-case resource names
- All APIs MUST be versioned under `/api/v1/` (or higher version)
- HTTP method MUST express the action
- Verbs in URLs are PROHIBITED

### 3.2 Response Structure (MANDATORY)

All API responses MUST follow the standard envelope defined in B01 §5.3:

```json
{
  "success": true | false,
  "data": {} | null,
  "error": null | { "code": "...", "message": "...", "details": {} },
  "meta": { "pagination": {...}, "trace_id": "uuid" }
}
```

- Raw DRF responses are PROHIBITED
- All API responses MUST be created by the central ResponseBuilder
- Response shape MUST be identical across ALL modules
- `errors` field is PROHIBITED - use `error` (singular)

### 3.3 HTTP Status Codes (MANDATORY)

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (e.g., successful delete with no body) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing or invalid authentication) |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate) |
| 422 | Unprocessable Entity (semantic validation failure) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

Custom or incorrect status codes are PROHIBITED.

### 3.4 Pagination (MANDATORY)

- Large datasets MUST be paginated
- Unbounded responses are PROHIBITED
- Pagination parameters MUST be validated on every list request
- A global `MAX_PAGE_SIZE` limit is REQUIRED
- Requests exceeding `MAX_PAGE_SIZE` MUST be rejected

Pagination envelope location:
```json
{
  "meta": {
    "pagination": {
      "total": 100,
      "limit": 25,
      "offset": 0,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 3.5 Filtering & Sorting (MANDATORY)

- Filtering MUST be supported via query parameters
- Filtering fields MUST be validated before application
- Unsafe filtering logic (raw user input injected into queries) is PROHIBITED
- Sorting fields MUST be validated against an allowed fields list

### 3.6 API Versioning (MANDATORY)

- API version MUST be included in URL
- Breaking changes MUST create a new API version
- Silent breaking changes are PROHIBITED
- API version lifecycle rules are governed by B01 §5.30

### 3.7 Idempotency (MANDATORY)

- Idempotent operations MUST remain idempotent
- Duplicate side effects are PROHIBITED
- State-changing POST requests for critical operations MUST require an `Idempotency-Key` header
- The system MUST store request result per Idempotency-Key and return cached response for duplicate requests
- See B01 §5.28 for full idempotency governance

Idempotency REQUIRED for:
- Financial operations (payments, billing, credits)
- External integrations
- Bulk imports
- Any operation triggering notifications or external side effects

### 3.8 Rate Limiting (MANDATORY)

- All APIs MUST enforce rate limiting
- Excess requests MUST return HTTP 429 with a standard error response
- Rate-limit governance is defined in B01 §5.24

### 3.9 Input Validation (MANDATORY)

- All inputs MUST be validated by DRF serializers in the View Layer
- Invalid input MUST be rejected with 400 and a structured error response
- Backend validation is the ONLY trusted validation source

### 3.10 Authentication (MANDATORY)

- Protected APIs MUST require authentication (governed by B06)
- Public endpoints MUST be explicitly defined and documented
- Unauthenticated requests to protected endpoints MUST return 401

### 3.11 Authorization (MANDATORY)

- All protected API operations MUST enforce RBAC (governed by B07)
- Unauthorized access MUST return 403

### 3.12 API Documentation (MANDATORY)

- All APIs MUST be documented
- Documentation MUST include: endpoint URL, HTTP method, request schema, response schema, error codes, authentication requirements
- Undocumented endpoints are PROHIBITED

### 3.13 API Deprecation Process (MANDATORY)

When deprecating an API endpoint:
1. Add deprecation warning header: `Deprecation: true`
2. Log all requests to deprecated endpoint
3. Communicate removal date to all consumers
4. Maintain endpoint through its documented support window
5. Remove only after documented removal date with confirmed migration

---

### 3.14 Background Job API Standard (MANDATORY)

Long-running operations MUST follow the async job pattern. No long-running operation MUST block the HTTP request cycle.

```
# 1. Client initiates long operation
POST /api/v1/payroll/runs/
→ 202 Accepted
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "queued",
    "estimated_duration_seconds": 30
  },
  "error": null,
  "meta": { "trace_id": "uuid", "correlation_id": "uuid" }
}

# 2. Client polls job status
GET /api/v1/jobs/{job_id}/
→ 200 OK
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "job_type": "PAYROLL_RUN",
    "status": "processing",   # queued / processing / completed / failed
    "progress": 45,
    "business_unit_id": "uuid",
    "created_at": "ISO8601",
    "started_at": "ISO8601",
    "estimated_completion": "ISO8601"
  },
  "error": null,
  "meta": { "trace_id": "uuid" }
}

# 3. Job completes → status: "completed", result_url provided
# 4. Job failed → status: "failed", error_code and error_message provided
```

Rules:
- All long-running endpoints MUST return 202 with a job_id immediately
- The `/api/v1/jobs/{id}/` endpoint MUST be tenant-scoped
- Job polling MUST enforce RBAC
- Jobs MUST expire after 24 hours and return 404 after expiry

### 3.15 Correlation ID in Responses (MANDATORY)

All API responses MUST return the `correlation_id` in:
1. The `meta` object: `"meta": { "trace_id": "...", "correlation_id": "..." }`
2. The response header: `X-Correlation-Id: {correlation_id}`

```python
# In ResponseBuilder:
response = Response({
    "success": True,
    "data": data,
    "error": None,
    "meta": {
        "trace_id": security_context.trace_id,
        "correlation_id": str(security_context.correlation_id),
        "pagination": pagination_meta,
    }
})
response["X-Correlation-Id"] = str(security_context.correlation_id)
return response
```

### 3.16 Module Subscription Error Code (MANDATORY)

| Code | Meaning |
|------|---------|
| 402 | Module not subscribed / Plan limit exceeded |
| 403 | `MODULE_NOT_SUBSCRIBED` - tenant has not subscribed to required module |

Standard response for module not subscribed:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "MODULE_NOT_SUBSCRIBED",
    "message": "Your plan does not include access to this module. Please upgrade your subscription.",
    "details": {
      "module_code": "PAYROLL",
      "current_plan": "FREE",
      "required_plan": "BASIC"
    }
  },
  "meta": { "trace_id": "uuid", "correlation_id": "uuid" }
}
```


## 4. SECURITY & COMPLIANCE

- All APIs MUST be secured against injection, CSRF, and abuse
- Sensitive data MUST NOT be exposed in API responses (B09)
- Error responses MUST NOT leak internal system details (X02)
- API requests MUST be logged with `trace_id`, `user_id`, endpoint, method, status code

---

## 5. NON-NEGOTIABLE RULES

- Inconsistent API response format = PROHIBITED
- Missing authentication on protected endpoint = CRITICAL violation
- Unvalidated input = PROHIBITED
- Breaking API contract without versioning = CRITICAL violation
- Verbs in API URLs = PROHIBITED
- Unbounded API responses = PROHIBITED
- Missing rate limiting = PROHIBITED
- Undocumented API endpoints = PROHIBITED
- Long-running operation blocking HTTP request = PROHIBITED
- API response missing correlation_id = PROHIBITED
- Missing X-Correlation-Id response header = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

Non-compliant APIs MUST NOT be deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- API contract MUST be tested (request schema, response schema)
- Authentication MUST be tested
- Authorization MUST be tested (403 on unauthorized)
- Rate limiting MUST be tested
- Error handling MUST be tested (400, 401, 403, 404, 500)
- Pagination limits MUST be tested
- Idempotency MUST be tested for covered operations
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- APIs MUST be versioned, consistent, and documented
- All responses MUST follow the standard envelope
- Contracts MUST be stable - breaking changes require new versions
- Security and validation are mandatory on every endpoint

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

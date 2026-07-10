<!-- yss_orbit\rulebooks\X02 - API ERROR CODES & ERROR CONTRACT.md -->
# X02 - API ERROR CODES & ERROR CONTRACT

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Applies To:** Backend (error generation) + Frontend (error consumption)
**Governance Role:** Error Contract Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Canonical error code catalogue, HTTP status code mapping, error response structure, error message standards, error detail format |
| REFERENCES | B01 (API envelope §5.3, error handling §5.4), B20 (typed exception hierarchy), F04 (frontend error handling), F07 (frontend error display) |
| MUST NOT DUPLICATE | API envelope structure (B01 §5.3), typed exception hierarchy (B20), frontend display (F07) |

---

## 1. PURPOSE

This rulebook defines the **canonical error code catalogue and error contract** for YSS Orbit.

It establishes:
- The full list of canonical error codes
- HTTP status code to error code mapping
- Error message standards
- Error detail formatting

ALL systems (backend and frontend) MUST use only these canonical error codes.

---

## 2. SCOPE

Applies to: all backend API error responses, all frontend error handling, all error display logic. No error path is exempt.

---

## 3. CANONICAL ERROR RESPONSE CONTRACT (MANDATORY)

All API error responses MUST follow this structure (defined in B01 §5.3):

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CANONICAL_ERROR_CODE",
    "message": "Human-readable, safe, user-facing message.",
    "details": {
      "field_name": ["Field-specific error message."]
    }
  },
  "meta": {
    "trace_id": "uuid",
    "correlation_id": "uuid"
  }
}
```

Rules:
- `code` MUST be from the canonical list in §4
- `message` MUST be safe for user display - no internal details
- `details` MUST contain field-level errors for validation failures
- `trace_id` MUST always be present in `meta`
- `errors` (plural) is PROHIBITED - MUST use `error` (singular)

---

## 4. CANONICAL ERROR CODE CATALOGUE (MANDATORY)

All backend exceptions MUST map to exactly one of the following canonical codes.

Custom error codes outside this catalogue are PROHIBITED unless formally added via Architecture Review.

### 4.1 Authentication Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 401 | `AUTHENTICATION_REQUIRED` | No auth credentials provided |
| 401 | `INVALID_CREDENTIALS` | Email/password mismatch |
| 401 | `TOKEN_EXPIRED` | Access token has expired |
| 401 | `TOKEN_INVALID` | Token signature invalid or malformed |
| 401 | `TOKEN_TYPE_MISMATCH` | Refresh token used where access token expected |
| 401 | `SESSION_EXPIRED` | Refresh token expired or revoked |
| 401 | `ACCOUNT_LOCKED` | Account locked due to too many failed attempts |
| 401 | `ACCOUNT_INACTIVE` | User account is deactivated |
| 401 | `MFA_REQUIRED` | MFA verification required to proceed |
| 401 | `MFA_INVALID` | Invalid MFA code provided |
| 200 | `EMAIL_VERIFICATION_REQUIRED` | Login blocked — email not yet verified; OTP sent |
| 200 | `MFA_OTP_SENT` | Login step-up — MFA OTP sent to registered email (distinct from resource-level MFA_REQUIRED) |
| 401 | `EMAIL_NOT_VERIFIED` | Attempt to access resource before email is verified |
| 401 | `OTP_INVALID` | OTP is incorrect (wrong digits) |
| 401 | `OTP_EXPIRED` | OTP has passed its 10-minute expiry |
| 401 | `OTP_ALREADY_USED` | OTP was already consumed in a previous request |
| 401 | `OTP_MAX_ATTEMPTS_EXCEEDED` | 5 incorrect OTP attempts — OTP is now locked |
| 401 | `RESET_TOKEN_INVALID` | Password reset token not found or already used |
| 401 | `RESET_TOKEN_EXPIRED` | Password reset token has passed its 15-minute expiry |

### 4.2 Authorization Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 403 | `PERMISSION_DENIED` | Authenticated but lacks required permission |
| 403 | `BUSINESS_UNIT_ACCESS_DENIED` | User is not authorized for this BusinessUnit |
| 403 | `CROSS_TENANT_ACCESS_DENIED` | Attempted access to another tenant's data |
| 403 | `GLOBAL_SCOPE_REQUIRED` | Operation requires GLOBAL data_scope |
| 403 | `MODULE_NOT_SUBSCRIBED` | BusinessUnit is not subscribed to this module |

### 4.3 Validation Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Request body fails validation (with field-level `details`) |
| 400 | `MISSING_REQUIRED_FIELD` | Required field not provided |
| 400 | `INVALID_FIELD_VALUE` | Field value is not acceptable |
| 400 | `INVALID_UUID` | Provided ID is not a valid UUID |
| 400 | `INVALID_PAGINATION` | Pagination parameters out of allowed range |
| 422 | `BUSINESS_RULE_VIOLATION` | Request valid but violates a business rule |
| 422 | `INVALID_STATE_TRANSITION` | Entity is not in a state that allows this operation |

### 4.4 Resource Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 404 | `NOT_FOUND` | Requested resource does not exist |
| 404 | `BUSINESS_UNIT_NOT_FOUND` | Specified BusinessUnit does not exist |
| 409 | `CONFLICT` | Resource with same unique key already exists |
| 409 | `DUPLICATE_ENTRY` | More specific duplicate conflict |

### 4.5 Rate Limiting & Quota Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests in window |
| 429 | `UPLOAD_QUOTA_EXCEEDED` | File upload quota exceeded |
| 402 | `PLAN_LIMIT_EXCEEDED` | Plan user/module/record limit reached — upgrade required (see E04 §3.6) |

### 4.6 File & Upload Errors (4xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 400 | `FILE_TYPE_NOT_ALLOWED` | File MIME type is not in the whitelist |
| 400 | `FILE_TOO_LARGE` | File exceeds maximum allowed size |
| 400 | `FILE_MISSING` | Expected file was not uploaded |
| 400 | `FILE_CORRUPTED` | File content is invalid or corrupted |

### 4.7 Server Errors (5xx)

| HTTP Status | Error Code | When to Use |
|-------------|-----------|-------------|
| 500 | `INTERNAL_ERROR` | Unexpected server-side exception |
| 503 | `SERVICE_UNAVAILABLE` | Dependency (DB, cache, queue) is unreachable |
| 504 | `GATEWAY_TIMEOUT` | External integration timed out |

---

## 5. ERROR MESSAGE STANDARDS (MANDATORY)

### 5.1 User-Facing Messages

User-facing messages in `error.message` MUST:
- Be in plain English (or the UI language)
- Be concise and actionable
- NOT expose system internals

Standard messages:

| Error Code | Standard Message |
|-----------|-----------------|
| `AUTHENTICATION_REQUIRED` | `"Authentication is required to access this resource."` |
| `INVALID_CREDENTIALS` | `"Invalid credentials. Please check your email and password."` |
| `TOKEN_EXPIRED` | `"Your session has expired. Please log in again."` |
| `PERMISSION_DENIED` | `"You do not have permission to perform this action."` |
| `BUSINESS_UNIT_ACCESS_DENIED` | `"You are not authorized to access this Business Unit."` |
| `CROSS_TENANT_ACCESS_DENIED` | `"Access denied."` (deliberately generic) |
| `MODULE_NOT_SUBSCRIBED` | `"This module is not available in your current subscription."` |
| `VALIDATION_ERROR` | `"The submitted data is invalid. Please correct the errors and try again."` |
| `NOT_FOUND` | `"The requested resource was not found."` |
| `CONFLICT` | `"A record with this information already exists."` |
| `RATE_LIMIT_EXCEEDED` | `"Too many requests. Please wait a moment before trying again."` |
| `INTERNAL_ERROR` | `"An unexpected error occurred. Please try again. If the issue persists, contact support."` |

### 5.2 Validation Error Detail Format

Validation errors MUST use `details` for field-level messages:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid. Please correct the errors and try again.",
    "details": {
      "email": ["Enter a valid email address."],
      "name": ["This field is required.", "Name must be at most 255 characters."],
      "business_unit_id": ["Invalid BusinessUnit ID."]
    }
  },
  "meta": { "trace_id": "uuid" }
}
```

---

## 6. BACKEND IMPLEMENTATION (MANDATORY)

Backend exception-to-code mapping:

```python
class AppException(Exception):
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

class PermissionDenied(AppException):
    status_code = 403
    error_code = "PERMISSION_DENIED"
    message = "You do not have permission to perform this action."

class BusinessUnitAccessDenied(AppException):
    status_code = 403
    error_code = "BUSINESS_UNIT_ACCESS_DENIED"
    message = "You are not authorized to access this Business Unit."

class CrossTenantAccessDenied(AppException):
    status_code = 403
    error_code = "CROSS_TENANT_ACCESS_DENIED"
    message = "Access denied."

class ResourceNotFound(AppException):
    status_code = 404
    error_code = "NOT_FOUND"
    message = "The requested resource was not found."

class ConflictError(AppException):
    status_code = 409
    error_code = "CONFLICT"
    message = "A record with this information already exists."
```

---

## 7. FRONTEND CONSUMPTION (MANDATORY)

Frontend MUST map error codes to UI behavior:

```typescript
function handleApiError(error: ApiError): void {
  switch (error.code) {
    case 'AUTHENTICATION_REQUIRED':
    case 'TOKEN_EXPIRED':
    case 'SESSION_EXPIRED':
      redirectToLogin();
      break;
    case 'OTP_EXPIRED':
    case 'OTP_MAX_ATTEMPTS_EXCEEDED':
      showOtpFlowError(errorCode);  // Handled in OTP verify page (F05 §2.6)
      break;
    case 'RESET_TOKEN_INVALID':
    case 'RESET_TOKEN_EXPIRED':
      redirectToForgotPassword();   // Handled in password reset flow (F05 §2.9)
      break;
    case 'PERMISSION_DENIED':
    case 'BUSINESS_UNIT_ACCESS_DENIED':
      showPermissionError(error.message);
      break;
    case 'VALIDATION_ERROR':
      mapFieldErrors(error.details);
      break;
    case 'RATE_LIMIT_EXCEEDED':
      showRateLimitWarning(error.message);
      break;
    case 'INTERNAL_ERROR':
    default:
      showGenericError(error.message, traceId);
      break;
  }
}
```

---

## 8. NON-NEGOTIABLE RULES

- Custom error codes outside this catalogue = PROHIBITED
- `errors` (plural) field = PROHIBITED - use `error` (singular)
- Internal stack trace in error response = PROHIBITED
- Missing `trace_id` in error response = PROHIBITED
- Missing `correlation_id` in error response `meta` = PROHIBITED
- Missing field-level `details` on `VALIDATION_ERROR` = PROHIBITED
- System internals in `message` field = PROHIBITED
- Duplicate error codes with conflicting HTTP status codes = PROHIBITED

---

## 9. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 10. QUICK SUMMARY

- All error responses use `{ success, data, error, meta }` envelope
- `error.code` MUST be from the canonical catalogue in §4
- `error.details` MUST contain field-level messages for validation errors
- `trace_id` MUST always be in `meta`
- Frontend MUST map error codes to UI behavior consistently

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

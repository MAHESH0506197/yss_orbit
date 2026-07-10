<!-- yss_orbit\rulebooks\B20 - ERROR HANDLING, INPUT VALIDATION & RESPONSE SAFETY.md -->
# B20 - ERROR HANDLING, INPUT VALIDATION & RESPONSE SAFETY

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B04 (Application Architecture), B12 (API Design)
**Governance Role:** Error Contract & Validation Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Error handling patterns, typed exception hierarchy, global exception handler, input validation standards per layer, safe error messages, response sanitization |
| REFERENCES | B01 (error flow §5.4, validation ownership §5.6, API envelope §5.3), X02 (error code catalogue), B15 (error logging) |
| MUST NOT DUPLICATE | API envelope (B01 §5.3), error code catalogue (X02), audit logging (B15) |

---

## 1. PURPOSE

This rulebook defines **error handling and input validation standards** for YSS Orbit.

It establishes:
- Error handling patterns and exception hierarchy
- Input validation responsibilities per layer
- Safe error message handling
- Response sanitization

All error handling MUST follow these standards.

---

## 2. SCOPE

Applies to: all API endpoints, all service layer operations, all background tasks, all validation logic. No error path is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Typed Exception Hierarchy (MANDATORY)

All application exceptions MUST derive from a typed hierarchy:

```python
class AppException(Exception):
    """Base exception - all domain exceptions inherit from this."""
    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An internal error occurred"

class ValidationError(AppException):
    status_code = 400
    error_code = "VALIDATION_ERROR"

class AuthenticationError(AppException):
    status_code = 401
    error_code = "AUTHENTICATION_REQUIRED"

class PermissionDenied(AppException):
    status_code = 403
    error_code = "PERMISSION_DENIED"

class ResourceNotFound(AppException):
    status_code = 404
    error_code = "NOT_FOUND"

class ConflictError(AppException):
    status_code = 409
    error_code = "CONFLICT"

class RateLimitExceeded(AppException):
    status_code = 429
    error_code = "RATE_LIMIT_EXCEEDED"
```

Generic `Exception` raises without wrapping are PROHIBITED.
Services MUST raise typed exceptions - NEVER return error dictionaries.

### 3.2 Global Exception Handler (MANDATORY)

A centralized global exception handler MUST intercept all unhandled exceptions and map them to standard API responses.

```python
class GlobalExceptionHandler:
    def __call__(self, exc, context):
        if isinstance(exc, AppException):
            return ResponseBuilder.error(
                code=exc.error_code,
                message=exc.message,
                status=exc.status_code,
                trace_id=context.get("trace_id"),
            )
        # Unknown exception - log and return safe 500
        logger.critical(f"Unhandled exception: {exc}", exc_info=True)
        return ResponseBuilder.error(
            code="INTERNAL_ERROR",
            message="An unexpected error occurred.",
            status=500,
            trace_id=context.get("trace_id"),
        )
```

Rules:
- Stack traces MUST NOT be exposed in API responses
- Internal exception messages MUST NOT be exposed to clients
- All unhandled exceptions MUST be logged with full traceback server-side

### 3.3 Validation Ownership (MANDATORY)

Per B01 §5.6:

| Layer | Validates |
|-------|----------|
| API/Serializer | Shape, types, formats, length, enum values |
| Service | Business rules, cross-entity rules, state machines, RBAC-sensitive constraints |
| Repository | Query safety, safe UUID parsing |
| Database | Integrity constraints, unique constraints |

Rules:
- Serializers MUST NOT call repositories or services for business validation
- Business validation MUST live exclusively in the Service Layer
- Database constraint errors MUST be caught and converted to safe API errors

### 3.4 Error Response Format (MANDATORY)

All error responses MUST follow the B01 §5.3 standard envelope:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": {
      "email": ["Enter a valid email address."],
      "name": ["This field is required."]
    }
  },
  "meta": {
    "trace_id": "uuid"
  }
}
```

Rules:
- `error` MUST be singular - `errors` is PROHIBITED
- `trace_id` MUST always be present in `meta`
- User-facing messages MUST be informative but safe
- Internal system details (stack traces, SQL, paths) MUST NOT appear in responses

### 3.5 Validation Rules Per Layer (MANDATORY)

**Serializer Layer:**
```python
class InventoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=255)
    quantity = serializers.IntegerField(min_value=0)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    # No DB calls here - shape validation only
```

**Service Layer:**
```python
def create_inventory(self, data, security_context):
    if Item.objects.filter(
        business_unit_id=security_context["selected_bu_id"],
        code=data["code"],
        is_deleted=False
    ).exists():
        raise ConflictError("An item with this code already exists.")
    # Proceed with creation
```

**Repository Layer:**
```python
def fetch_by_id(self, item_id: str, business_unit_id: str):
    try:
        item_uuid = UUID(item_id)
    except ValueError:
        raise ValidationError("Invalid item ID format.")
    return Item.objects.get(id=item_uuid, business_unit_id=business_unit_id)
```

### 3.6 Error Message Safety (MANDATORY)

Error messages MUST be:
- Safe for public display
- Informative enough to help users correct input
- Free of internal system details

PROHIBITED content in user-facing error messages:
- Stack traces
- SQL queries or table names
- Internal paths or file locations
- Environment-specific details
- Third-party service error details
- Security-sensitive information

### 3.7 5xx Error Handling (MANDATORY)

- 5xx errors MUST be logged with full context server-side
- 5xx errors MUST return a generic safe message to clients
- Monitoring MUST be alerted on elevated 5xx error rates
- 5xx errors MUST include `trace_id` for debugging

### 3.8 Unhandled Exceptions (MANDATORY)

- Unhandled exceptions MUST be caught by the global exception handler
- Unhandled exceptions MUST return 500 with a safe message
- Unhandled exceptions MUST be logged immediately with full traceback

---

## 4. SECURITY & COMPLIANCE

- Leaking internal error details = security vulnerability
- Missing validation = injection risk
- Unhandled exceptions without logging = observability failure

---

## 5. NON-NEGOTIABLE RULES

- Stack trace in API response = PROHIBITED
- Generic Exception raises without typed wrapping = PROHIBITED
- Business validation in Serializer layer = PROHIBITED
- Service returning error dict = PROHIBITED
- Missing trace_id in error response = PROHIBITED
- Internal system info in user-facing messages = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Error response format MUST be validated for all error paths
- Typed exceptions MUST be tested (correct HTTP status codes)
- Validation logic MUST be tested per layer
- Global exception handler MUST be tested (including unknown exceptions)
- Error message safety MUST be tested (no leakage)
- trace_id presence MUST be validated in all responses
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- Services MUST raise typed exceptions - never return error dicts
- Global exception handler MUST intercept all errors
- Stack traces MUST NEVER reach clients
- Validation is layered: Serializer (shape) → Service (business) → Repository (safety) → DB (integrity)
- All error responses MUST include trace_id

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

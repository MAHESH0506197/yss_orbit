<!-- yss_orbit\rulebooks\B16 - SECURITY HEADERS & HTTP HARDENING.md -->
# B16 - SECURITY HEADERS & HTTP HARDENING

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B06 (Authentication), B09 (Data Security)
**Governance Role:** HTTP Security Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | HTTP security headers, CSP policy, CORS policy, HSTS enforcement, cookie security hardening, clickjacking prevention, MIME sniffing prevention, referrer policy |
| REFERENCES | B06 (cookie security attributes), B09 (encryption in transit), B01 (rate limiting) |
| MUST NOT DUPLICATE | Authentication cookie specifics (B06), TLS enforcement (B09), rate limiting (B01 §5.24) |

---

## 1. PURPOSE

This rulebook defines **HTTP security hardening standards** for YSS Orbit.

It establishes:
- HTTP security headers
- CORS policy
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- Cookie security
- Attack surface minimization

All HTTP responses MUST include these protections.

---

## 2. SCOPE

Applies to: all HTTP responses from the backend API, all web-accessible endpoints, all environments (with appropriate environment-specific values). No endpoint is exempt.

---

## 3. CORE GOVERNANCE LAWS

### 3.1 Required Security Headers (MANDATORY)

All API responses MUST include the following security headers:

```python
SECURE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",  # For auth endpoints
    "Pragma": "no-cache",
}
```

Production MUST additionally include:
```python
"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
```

Missing security headers on any API response = HIGH violation.

### 3.2 HSTS (MANDATORY)

- HSTS MUST be enabled in production with `max-age=31536000` (1 year minimum)
- `includeSubDomains` MUST be set
- HTTP access MUST be redirected to HTTPS in production
- HSTS `preload` is REQUIRED for public-facing endpoints

### 3.3 Content Security Policy (MANDATORY)

CSP MUST restrict which sources can load scripts, styles, and media.

Production CSP baseline:
```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

Rules:
- `script-src 'unsafe-eval'` is PROHIBITED in production
- `script-src 'unsafe-inline'` is PROHIBITED in production (use nonces if needed)
- `default-src *` is PROHIBITED in production
- CSP violations MUST be reported via `report-uri` or `report-to` in production

### 3.4 CORS Policy (MANDATORY)

- CORS MUST be explicitly configured
- `Access-Control-Allow-Origin: *` is PROHIBITED in production
- Allowed origins MUST be a whitelist of known, trusted domains defined in configuration
- CORS configuration MUST be applied via `django-cors-headers` - not per-view manual headers
- `CorsMiddleware` MUST be first in the Django middleware stack

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",        # Development
    "https://app.yourdomain.com",   # Production
]
CORS_ALLOW_CREDENTIALS = True  # Required for HttpOnly cookie auth
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = ["Accept", "Content-Type", "X-CSRFToken", "Authorization"]
CORS_EXPOSE_HEADERS = ["X-Trace-Id"]
```

### 3.5 Cookie Security (MANDATORY)

All cookies MUST follow the security specification defined in B06 §5.4:

| Attribute | Required Value |
|-----------|---------------|
| `HttpOnly` | `True` |
| `Secure` | `True` in production |
| `SameSite` | `Lax` |
| `Path` | `/` |
| `Domain` | NOT set (use `__Host-` prefix in production) |

Non-HttpOnly cookies containing authentication data are PROHIBITED.

### 3.6 Clickjacking Prevention (MANDATORY)

- `X-Frame-Options: DENY` MUST be set on all responses
- `frame-ancestors 'none'` MUST be set in CSP
- Embedding the application in iframes on third-party sites is PROHIBITED

### 3.7 MIME Sniffing Prevention (MANDATORY)

- `X-Content-Type-Options: nosniff` MUST be set on all responses
- Browsers MUST NOT be allowed to guess content type

### 3.8 Information Disclosure Prevention (MANDATORY)

- Server version headers MUST be stripped (e.g., `Server`, `X-Powered-By`)
- Internal framework versions MUST NOT be disclosed in responses
- Detailed stack traces MUST NOT be returned in API error responses
- Django's default debug error pages MUST be disabled in staging and production

### 3.9 Django Security Settings (MANDATORY)

```python
# REQUIRED for production:
DEBUG = False
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

DEBUG = True in production = CRITICAL violation.

### 3.10 Error Response Hardening (MANDATORY)

- Error responses MUST NOT expose stack traces to clients
- Error responses MUST NOT expose internal system paths, query details, or environment info
- Generic error messages MUST be returned to clients (see X02 for error codes)
- Detailed errors MUST be logged server-side only (B15)

---

## 4. SECURITY & COMPLIANCE

- Missing security headers = security vulnerability
- `DEBUG = True` in production = CRITICAL violation
- `CORS: *` in production = CRITICAL violation
- Stack trace in error response = HIGH violation

---

## 5. NON-NEGOTIABLE RULES

- `DEBUG = True` in production = CRITICAL violation
- `Access-Control-Allow-Origin: *` in production = CRITICAL violation
- Missing HSTS in production = HIGH violation
- Missing `X-Content-Type-Options` = HIGH violation
- Missing `X-Frame-Options` = HIGH violation
- `script-src 'unsafe-eval'` or `'unsafe-inline'` in production CSP = HIGH violation
- Stack trace in API error response = PROHIBITED
- Non-HttpOnly auth cookies = PROHIBITED

---

## 6. VIOLATIONS & ENFORCEMENT

Non-compliant deployments MUST be blocked.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject changes |
| MEDIUM | Fix required |

---

## 7. TESTING REQUIREMENTS

- Security headers MUST be validated in production config tests
- CORS policy MUST be tested (allowed origins, credential handling)
- CSP violations MUST be monitored
- Cookie security attributes MUST be tested
- Debug mode MUST be verified as disabled in production
- Server version disclosure MUST be tested (verify stripped headers)
- Any failing test MUST block deployment

---

## 8. QUICK SUMMARY

- All security headers REQUIRED on every response
- HSTS REQUIRED in production (1 year minimum)
- CORS MUST be a whitelist - never `*`
- CSP MUST restrict scripts to `'self'`
- `DEBUG = False` REQUIRED in production
- Cookies MUST be HttpOnly + Secure + SameSite

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECT REVIEW.

<!-- yss_orbit\rulebooks\B06 - AUTHENTICATION SYSTEM (LOGIN, MFA, SESSIONS).md -->
# B06 - AUTHENTICATION SYSTEM (LOGIN, MFA, SESSIONS)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** B01 (System Foundation), B02 (Multi-Tenant), B04 (Application Architecture)
**Governance Role:** Authentication Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | User identity verification, login flow and validation order, OTP governance (generation, storage, verification, expiry), email verification flow, MFA OTP flow, password reset OTP flow, session and token management, cookie security specification, password policy, account lockout, CSRF initialization, token rotation, logout handling, rate limits for auth endpoints, post-login routing contract, auth audit logging |
| REFERENCES | B01 (security_context construction), B07 (RBAC — loaded after auth), B15 (audit logging implementation), B16 (security headers) |
| MUST NOT DUPLICATE | RBAC rules (B07), security headers (B16), permission loading (B07) |

---

## 1. PURPOSE

This rulebook defines the **complete authentication system** for YSS Orbit.

It establishes:
- User identity verification and login validation order
- OTP governance (all three purposes: EMAIL_VERIFICATION, LOGIN_MFA, PASSWORD_RESET)
- Email verification flow triggered from login
- MFA enforcement and OTP-based verification
- Password reset OTP flow
- Session and token management
- Multi-factor authentication
- Cookie security specification
- Password policy enforcement
- Post-login routing contract

All system access MUST be authenticated using these rules.

---

## 2. SCOPE

Applies to: user login and logout, OTP generation and verification, email verification, token generation and validation, session lifecycle, MFA (OTP-based), authentication middleware, CSRF protection, password reset. No access entry point is exempt.

---

## 3. DEFINITIONS

| Term | Definition |
|------|-----------|
| Authentication | Process of verifying user identity |
| Access Token | Short-lived JWT for API access (15 minutes) |
| Refresh Token | Long-lived token to obtain new access tokens (7 days) |
| Session | Authenticated user state tracked server-side |
| MFA | Multi-factor authentication — OTP-based in this platform |
| OTP | One-time password — 6-digit numeric code, single-use, purpose-scoped |
| OTP Purpose | `EMAIL_VERIFICATION` \| `LOGIN_MFA` \| `PASSWORD_RESET` |
| Reset Token | Short-lived server-issued token granted ONLY after OTP verification — used to authorize the password reset endpoint |
| HttpOnly Cookie | Browser cookie inaccessible to JavaScript |
| `__Host-` Prefix | Cookie prefix enforcing Secure + no Domain + Path=/ |
| CSRF | Cross-site request forgery |
| Token Type | Access vs. refresh — MUST be validated independently |

---

## 4. AUTHENTICATION MODEL

### Responsibility Split

| Layer | Responsibility |
|-------|---------------|
| Frontend | Call APIs, handle redirects, display OTP pages, manage pending auth state, handle 401 (trigger re-auth), send CSRF token |
| Browser | Store cookies automatically, send cookies on each request |
| Backend | Validate credentials, generate OTPs, issue tokens, set/delete cookies, control full auth lifecycle |

Frontend MUST NEVER handle raw token values.
Frontend MUST NEVER compute OTPs or auth decisions.

### Token Lifetimes

| Token | Lifetime |
|-------|---------|
| Access Token | 15 minutes |
| Refresh Token | 7 days |
| Password Reset Token | 15 minutes (issued after OTP verification) |
| OTP | 10 minutes |

---

## 5. CORE GOVERNANCE LAWS

### 5.1 Credential Handling (MANDATORY)

- Passwords MUST be hashed using `Argon2` or `bcrypt` (minimum 12 rounds for bcrypt)
- Plain-text passwords are PROHIBITED
- Passwords MUST NOT be logged, returned in APIs, or stored in state

### 5.2 Password Policy (MANDATORY)

Passwords MUST meet ALL of the following requirements:
- Minimum 8 characters in length
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one digit (0–9)
- At least one special character
- MUST NOT match a common passwords list
- MUST NOT match any of the user's last 5 passwords (password history check)

```python
import re

def validate_password_strength(password: str, user_id: UUID | None = None) -> None:
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one digit")
    if not re.search(r'[^A-Za-z0-9]', password):
        errors.append("Password must contain at least one special character")
    common_passwords = ['password', 'password123', '12345678', 'admin123', 'qwerty123']
    if password.lower() in common_passwords:
        errors.append("This password is too common")
    if user_id:
        if PasswordHistoryRepository.is_recently_used(user_id, password):
            errors.append("You cannot reuse one of your last 5 passwords")
    if errors:
        raise ValidationError(errors)
```

**Violation:** Accepting weak passwords = security vulnerability (HIGH).

### 5.3 Login Validation Order (MANDATORY)

Backend MUST validate login in this EXACT order. Each check is independent — if a check fails, stop and return the appropriate response. Do NOT reveal which specific check failed to the user (use generic messages).

```text
Step 1. Does the username exist?
        → NO:  return 401 INVALID_CREDENTIALS (generic)

Step 2. Is the account soft-deleted or inactive?
        → YES: return 401 ACCOUNT_INACTIVE
                Frontend: stay on login, show support contact message

Step 3. Is the account locked?
        → YES: return 401 ACCOUNT_LOCKED
                Frontend: stay on login, show lockout message with support contact

Step 4. Is the password correct?
        → NO:  increment failed_login_attempts
               if failed_login_attempts >= 5: lock account
               return 401 INVALID_CREDENTIALS (generic)
               Frontend: stay on login, show generic error

Step 5. Is the email verified?
        → NO:  generate EMAIL_VERIFICATION OTP (§5.16)
               send OTP email (§5.18)
               return 200 with status: EMAIL_VERIFICATION_REQUIRED
               Frontend: redirect → /otp-verify?purpose=EMAIL_VERIFICATION

Step 6. Is MFA enabled for this user?
        → YES: generate LOGIN_MFA OTP (§5.16)
               send OTP (email or authenticator app)
               return 200 with status: MFA_OTP_SENT
               Frontend: redirect → /otp-verify?purpose=LOGIN_MFA

Step 7. All checks passed → issue session/JWT
        Load: allowed_business_unit_ids, user role, permissions
        return 200 with full auth payload
        Frontend: run selectPostLoginRoute() (§5.19)
```

**CRITICAL:** The order MUST NOT be changed. Especially Step 5 (email verification) MUST come AFTER password validation (Step 4) — never before.

**CRITICAL:** A generic error message MUST be used for Steps 1 and 4. NEVER reveal whether the username or password specifically was wrong.

### 5.4 Cookie Specification (MANDATORY)

Authentication tokens MUST be stored in HttpOnly cookies. Raw token exposure to JavaScript is PROHIBITED.

| Property | Development | Production |
|----------|------------|------------|
| Access cookie name | `access_token` | `__Host-access_token` |
| Refresh cookie name | `refresh_token` | `__Host-refresh_token` |
| HttpOnly | `True` | `True` |
| Secure | `False` | `True` |
| SameSite | `Lax` | `Lax` |
| Path | `/` | `/` |
| Domain | Not set | Not set |

The `__Host-` prefix in production MUST be used — it enforces `Secure` flag, no `Domain`, `Path=/`.

```python
DEBUG = os.getenv("ENV") == "development"
ACCESS_COOKIE_NAME  = "access_token"  if DEBUG else "__Host-access_token"
REFRESH_COOKIE_NAME = "refresh_token" if DEBUG else "__Host-refresh_token"
ACCESS_TOKEN_LIFETIME  = 15 * 60        # 15 minutes
REFRESH_TOKEN_LIFETIME = 7 * 24 * 3600  # 7 days
```

### 5.5 Token Validation (MANDATORY)

Every request MUST validate the access token for BOTH signature AND type.

```python
def validate_access_token(token):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    if payload.get("type") != "access":
        raise InvalidTokenError("Expected access token, received refresh token")
    return payload

def validate_refresh_token(token):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    if payload.get("type") != "refresh":
        raise InvalidTokenError("Expected refresh token, received access token")
    return payload
```

The refresh endpoint MUST reject access tokens (and vice versa).

### 5.6 Token Rotation & Refresh Flow (MANDATORY)

Refresh flow REQUIRED order:
1. Access token expired → read refresh token from cookie
2. Validate refresh token (signature + type)
3. Re-fetch user permissions from DB (MUST NOT reuse permissions from token payload)
4. Generate new access token
5. Set new access token in cookie
6. Continue processing the original request

```python
# REQUIRED: Fresh permissions from DB on every refresh
user_permissions = load_user_permissions(user_id)  # From DB, not token payload

# PROHIBITED:
permissions = payload.get("permissions")  # Stale — cannot detect revocations
```

Refresh tokens MUST be rotated on use. Reuse of a used refresh token MUST be detected and MUST invalidate ALL sessions.

### 5.7 Session Management (MANDATORY)

- Sessions MUST be tracked server-side
- Each session MUST be tracked independently (device-level)
- Session invalidation MUST occur on logout
- Password reset or critical security events MUST immediately invalidate ALL active sessions and refresh tokens across all devices

Session storage MUST NOT contain:
```python
session['permissions'] = [...]        # PROHIBITED
session['role'] = 'admin'             # PROHIBITED
session['business_unit_ids'] = [...]  # PROHIBITED
```

### 5.8 MFA Enforcement (MANDATORY)

- MFA MUST be supported for all users who have it enabled
- MFA MUST be REQUIRED for admin users and users with sensitive permissions
- MFA MUST use OTP-based verification governed by §5.16
- MFA bypass is PROHIBITED

MFA OTP flow (triggered at Step 6 of §5.3):

```text
Backend:
  1. Generate LOGIN_MFA OTP (§5.16)
  2. Send OTP to registered email (or authenticator app)
  3. Return: { "status": "MFA_OTP_SENT", "pending_user_id": "<uuid>" }

Frontend:
  1. Store pending_user_id + purpose='LOGIN_MFA' in session state (§F05 §2.12)
  2. Redirect → /otp-verify?purpose=LOGIN_MFA

OTP Verify Page:
  User enters OTP
  Frontend POST /api/verify-otp/
  { "pending_user_id": "uuid", "otp": "123456", "purpose": "LOGIN_MFA" }

Backend OTP validation (§5.17):
  → VALID: issue session/JWT → return full auth payload
            Frontend: run selectPostLoginRoute()
  → INVALID: return 401 OTP_INVALID
  → EXPIRED: return 401 OTP_EXPIRED
  → MAX_ATTEMPTS: return 401 OTP_MAX_ATTEMPTS_EXCEEDED → lock OTP
```

### 5.9 Account Security (MANDATORY)

- Account lockout MUST occur after 5 repeated failed login attempts
- Locked accounts MUST require admin unlock or a timed automatic unlock (configurable — default 30 minutes)
- Password reset MUST use an OTP-based flow (not a link with token in URL)
- OTP MUST expire within 10 minutes
- OTPs MUST be single-use (consumed on verification)
- Password reset response MUST always be generic — NEVER reveal if the username exists
- After successful password reset: ALL sessions, refresh tokens, reset tokens, and OTPs MUST be revoked

### 5.10 Token Storage Prohibition (MANDATORY)

PROHIBITED for ALL clients:
- Storing access or refresh tokens in `localStorage` — CRITICAL violation
- Storing tokens in `sessionStorage` — CRITICAL violation
- Tokens accessible via JavaScript — PROHIBITED

REQUIRED:
- Web clients MUST store tokens ONLY in HttpOnly + Secure + SameSite cookies
- Frontend MUST NEVER read, store, or manipulate token values

**Note:** Pending auth state (pendingUserId, pendingEmail, purpose) is NOT a token. It is non-sensitive metadata used to resume an in-progress OTP flow. It MAY be stored in `sessionStorage` — see F05 §2.12 for the complete specification.

### 5.11 Logout Handling (MANDATORY)

Logout MUST:
1. Call the backend logout API
2. Backend deletes both access and refresh token cookies
3. Backend blacklists/invalidates the refresh token in DB
4. Frontend clears all auth state and pending auth state
5. Frontend redirects to login

Partial logout is PROHIBITED. Token reuse after logout MUST be blocked.

### 5.12 CSRF Protection (MANDATORY)

Django CSRF configuration REQUIRED:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',    # MUST be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',    # MUST be enabled
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]

CSRF_COOKIE_HTTPONLY = False    # Frontend JS must read csrftoken cookie
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',    # Dev
    'https://your-domain.com',  # Prod
]
```

`GET /api/init/` MUST exist and MUST be called BEFORE login to initialize the CSRF cookie:

```text
GET /api/init/ → Sets CSRF cookie → Frontend can send POST /api/login/
```

### 5.13 Security Context Integration (MANDATORY)

- `security_context` MUST be created after successful authentication (per B01 §5.7)
- User identity MUST be derived ONLY from validated tokens
- User permissions MUST be loaded from DB — NEVER from token payload
- `security_context` MUST be immutable after creation

### 5.14 Multi-Device Sessions (MANDATORY)

- Multiple simultaneous sessions MAY be allowed
- Each session MUST be independently tracked and invalidatable
- Logout from one device MUST NOT automatically logout other devices
- Security events (password reset, lockout) MUST logout ALL devices

### 5.15 Public Endpoints (No Authentication Required)

```text
GET  /api/init/              → CSRF cookie initialization (MUST be first call)
POST /api/login/             → Login (validates credentials, returns status)
POST /api/forgot-password/   → Request PASSWORD_RESET OTP
POST /api/verify-otp/        → Unified OTP verification (all three purposes)
POST /api/reset-password/    → Submit new password (requires reset_token)
POST /api/verify-email/      → Legacy — use /api/verify-otp/ with purpose=EMAIL_VERIFICATION
POST /api/token/refresh/     → Token refresh (validates refresh cookie)
```

---

## 5.16 OTP Governance (MANDATORY)

OTPs are used for three purposes. All three MUST follow these rules.

### OTP Properties

| Property | Value |
|----------|-------|
| Format | 6 numeric digits |
| Expiry | 10 minutes |
| Usage | Single-use (consumed on first successful verification) |
| Scope | Purpose-scoped — an OTP generated for `LOGIN_MFA` MUST NOT be accepted for `EMAIL_VERIFICATION` |
| Storage | Hashed in DB (bcrypt or Argon2) — plaintext OTP MUST NOT be stored |
| Max attempts | 5 attempts before OTP is locked |
| Rate limit | 5 OTP generation requests per 10 minutes per user |

### OTP Purposes

| Purpose | Trigger | Used For |
|---------|---------|----------|
| `EMAIL_VERIFICATION` | Login Step 5: email not verified | Verifying user's registered email |
| `LOGIN_MFA` | Login Step 6: MFA enabled | Second factor for login |
| `PASSWORD_RESET` | POST /api/forgot-password/ | Authorizing password reset |

### OTP Database Schema

```sql
CREATE TABLE otp (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id),
    otp_hash         VARCHAR(200) NOT NULL,   -- hashed OTP — NEVER store plaintext
    purpose          VARCHAR(30) NOT NULL,     -- 'EMAIL_VERIFICATION' | 'LOGIN_MFA' | 'PASSWORD_RESET'
    is_used          BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_count    INTEGER NOT NULL DEFAULT 0,
    expires_at       TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at          TIMESTAMPTZ
);

CREATE INDEX idx_otp_user_purpose ON otp(user_id, purpose) WHERE is_used = FALSE;
```

### OTP Generation

```python
import secrets
import hashlib

def generate_otp(user_id: UUID, purpose: str) -> str:
    # Invalidate any existing unused OTPs for this user+purpose
    OTP.objects.filter(user_id=user_id, purpose=purpose, is_used=False).update(is_used=True)

    raw_otp = str(secrets.randbelow(1_000_000)).zfill(6)  # 6-digit

    OTP.objects.create(
        user_id=user_id,
        otp_hash=hash_otp(raw_otp),
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    return raw_otp  # Return plaintext to send via email — NEVER store it
```

### OTP Verification

```python
def verify_otp(user_id: UUID, raw_otp: str, purpose: str) -> None:
    otp = OTP.objects.filter(
        user_id=user_id,
        purpose=purpose,
        is_used=False,
    ).order_by('-created_at').first()

    if not otp:
        raise OTPInvalidError()

    if otp.expires_at < timezone.now():
        raise OTPExpiredError()

    if otp.attempt_count >= 5:
        raise OTPMaxAttemptsError()

    if not check_otp_hash(raw_otp, otp.otp_hash):
        otp.attempt_count += 1
        otp.save(update_fields=['attempt_count'])
        raise OTPInvalidError()

    # Valid — consume
    otp.is_used = True
    otp.used_at = timezone.now()
    otp.save(update_fields=['is_used', 'used_at'])
```

---

## 5.17 Email Verification Flow (MANDATORY)

Email verification is triggered at **Step 5 of the login flow** (§5.3) when `email_verified = False`.

### Backend response when email not verified

```json
{
  "success": true,
  "data": {
    "status": "EMAIL_VERIFICATION_REQUIRED",
    "pending_user_id": "uuid",
    "pending_email": "m***h@example.com"
  },
  "error": null,
  "meta": { "trace_id": "uuid", "correlation_id": "uuid" }
}
```

`pending_email` MUST be masked (show first and last character, mask the rest). This is for UX only — the frontend displays it so the user knows which email to check.

### After OTP verification (EMAIL_VERIFICATION)

```python
# On successful /api/verify-otp/ with purpose=EMAIL_VERIFICATION:
User.objects.filter(id=pending_user_id).update(email_verified=True)
# Then proceed: check MFA (Step 6), then issue session
```

After email verification succeeds, login MUST continue at Step 6 (MFA check) — do NOT redirect to login again. The backend proceeds to check MFA and either issues the session or requests MFA verification.

---

## 5.18 OTP Email Content Standard (MANDATORY)

All OTP emails MUST contain:

| Field | Content |
|-------|---------|
| Username | The user's username (NOT email) |
| Registered email | The email the OTP was sent to (masked: `m***h@example.com`) |
| OTP code | 6-digit OTP |
| Expiry | "This code expires in 10 minutes" |
| Purpose | Context-appropriate subject and body |
| Security notice | "If you did not request this, please contact support immediately." |

### Environment behaviour

| Environment | Behaviour |
|-------------|----------|
| Development | Print OTP to terminal (console log) — MUST NOT send real email |
| Staging | Use a test SMTP provider (Mailtrap or equivalent) |
| Production | Real SMTP (SES, SendGrid, or equivalent) |

---

## 5.19 Post-Login Routing Contract (MANDATORY)

After issuing a session (Step 7 of §5.3, or after MFA OTP verified), the backend MUST include routing data in the response. The frontend MUST use this to determine where to navigate.

### Backend response after successful authentication

```json
{
  "success": true,
  "data": {
    "status": "AUTHENTICATED",
    "user_id": "uuid",
    "is_super_admin": false,
    "allowed_business_units": [
      { "id": "uuid", "name": "Main Branch", "code": "MAIN" },
      { "id": "uuid", "name": "City Branch", "code": "CITY" }
    ],
    "permissions": ["hrms.employee.view", "payroll.run.view"],
    "role_code": "MANAGER"
  },
  "error": null,
  "meta": { "trace_id": "uuid", "correlation_id": "uuid" }
}
```

### Routing decision matrix (frontend — see F05 §2.13)

| Condition | Route |
|-----------|-------|
| `is_super_admin = true` | → `/dashboard` |
| `allowed_business_units` is empty | → `/no-business-unit` |
| `allowed_business_units` has exactly 1 entry | Auto-select BU → `/dashboard` |
| `allowed_business_units` has 2+ entries | → `/select-business-unit` |

---

## 5.20 Password Reset OTP Flow (MANDATORY)

The password reset flow uses OTP — NOT a link with a token in the URL.

### Step 1 — Request OTP

```text
POST /api/forgot-password/
{ "username": "mahesh" }

Backend:
  1. Check if username exists (MUST NOT reveal result)
  2. If exists AND account active AND email registered:
     → generate PASSWORD_RESET OTP (§5.16)
     → send OTP email (§5.18)
  3. ALWAYS return the same generic response:

{
  "success": true,
  "data": { "message": "If this account exists, reset instructions have been sent." },
  "error": null,
  "meta": { "trace_id": "uuid", "correlation_id": "uuid" }
}
```

### Step 2 — Verify OTP

```text
POST /api/verify-otp/
{ "username": "mahesh", "otp": "123456", "purpose": "PASSWORD_RESET" }

Backend:
  → VALID:   mark OTP consumed
             issue short-lived reset_token (UUID, stored hashed in DB, 15 min TTL)
             return: { "reset_token": "opaque-uuid" }
  → INVALID: 401 OTP_INVALID
  → EXPIRED: 401 OTP_EXPIRED
```

### Step 3 — Submit New Password

```text
POST /api/reset-password/
{
  "reset_token": "opaque-uuid",
  "new_password": "...",
  "confirm_password": "..."
}

Backend:
  1. Validate reset_token exists, not used, not expired
  2. validate_password_strength(new_password) (§5.2)
  3. Check confirm_password matches
  4. Update password hash
  5. Mark reset_token as used
  6. Revoke ALL active sessions and refresh tokens for this user
  7. Revoke ALL unused OTPs for this user
  8. Add to password history
  9. Audit log: PASSWORD_RESET_SUCCESS
  10. Return success

Frontend: redirect → /login with message "Password reset successfully. Please log in."
```

---

## 6. SECURITY & COMPLIANCE

### Rate Limiting (MANDATORY)

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/login/` | 10 requests / 5 minutes | per IP |
| `POST /api/forgot-password/` | 5 requests / 10 minutes | per IP |
| `POST /api/verify-otp/` | 10 requests / 10 minutes | per user_id |
| `POST /api/reset-password/` | 10 requests / 5 minutes | per IP |

### Audit Logging (MANDATORY)

All authentication events MUST be logged with `user_id`, `ip_address`, `timestamp`, `trace_id`, `correlation_id`.

| Event | Code | Required Fields |
|-------|------|----------------|
| Login success | `LOGIN_SUCCESS` | user_id, ip, timestamp, trace_id, correlation_id |
| Login failure | `LOGIN_FAILURE` | ip, attempt_count, timestamp |
| Account locked | `ACCOUNT_LOCKED` | user_id, ip, timestamp |
| Account inactive denied | `ACCOUNT_INACTIVE_DENIED` | ip, timestamp |
| OTP issued | `OTP_ISSUED` | user_id, purpose, timestamp |
| OTP verified | `OTP_VERIFIED` | user_id, purpose, timestamp |
| OTP failed | `OTP_FAILED` | user_id, purpose, attempt_count, timestamp |
| OTP expired | `OTP_EXPIRED` | user_id, purpose, timestamp |
| OTP max attempts | `OTP_MAX_ATTEMPTS` | user_id, purpose, timestamp |
| Email verified | `EMAIL_VERIFIED` | user_id, timestamp |
| MFA verified | `MFA_VERIFIED` | user_id, timestamp |
| Password reset started | `PASSWORD_RESET_STARTED` | user_id, timestamp |
| Password reset success | `PASSWORD_RESET_SUCCESS` | user_id, timestamp |
| Logout | `LOGOUT` | user_id, timestamp |
| Token refresh | `TOKEN_REFRESH` | user_id, timestamp |

MUST NOT log: password values, raw OTP codes, token values, CSRF tokens, or any sensitive credential.

---

## 7. NON-NEGOTIABLE RULES

- Unauthenticated access to protected endpoints = PROHIBITED
- Tokens in localStorage/sessionStorage = CRITICAL violation
- Missing `__Host-` prefix in production = security misconfiguration
- Missing token type validation = security vulnerability
- Missing CSRF protection = CRITICAL violation
- MFA bypass = PROHIBITED
- Refreshing without re-fetching permissions from DB = PROHIBITED
- Session storing permissions or BU data = PROHIBITED
- Accepting passwords failing complexity requirements = HIGH violation
- OTP stored in plaintext in DB = CRITICAL violation
- OTP not purpose-scoped (accepting OTP from wrong purpose) = CRITICAL violation
- OTP not single-use (not consumed after verification) = CRITICAL violation
- Revealing username existence in forgot-password response = PROHIBITED
- Password reset using URL link token (instead of OTP) = PROHIBITED
- Email verification step skipped or wrong order in login flow = CRITICAL violation
- Post-login routing not following §5.19 routing matrix = PROHIBITED
- Raw OTP codes in log entries = PROHIBITED (CRITICAL)

---

## 8. VIOLATIONS & ENFORCEMENT

Non-compliant code MUST NOT be merged or deployed.

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 9. TESTING REQUIREMENTS

- Login validation order (all 7 steps including email verification) MUST be tested
- Password complexity validation (including special character and history) MUST be tested
- OTP generation — format, expiry, hashing MUST be tested
- OTP verification — valid, invalid, expired, max attempts, wrong purpose MUST all be tested
- OTP single-use enforcement (cannot verify same OTP twice) MUST be tested
- Email verification triggered from login MUST be tested
- MFA OTP flow (complete step-by-step) MUST be tested
- Password reset OTP flow (all 3 steps) MUST be tested
- Token validation MUST be tested (including wrong token type)
- Token refresh flow MUST be tested (including stale permission detection)
- Session invalidation on logout MUST be tested
- Account lockout after 5 failed login attempts MUST be tested
- ALL sessions revoked after password reset MUST be tested
- Post-login routing matrix (all 4 conditions) MUST be tested
- Rate limiting MUST be tested
- Cookie security attributes MUST be validated in production config tests
- CSRF initialization flow MUST be tested
- Any failing test MUST block deployment

---

## 10. QUICK SUMMARY

| Concern | Rule |
|---------|------|
| Auth tokens | JWT in HttpOnly cookies (`__Host-` prefix in production) |
| Frontend token access | NEVER — frontend never sees tokens |
| OTP | 6 digits, 10 min, single-use, purpose-scoped, hashed in DB, max 5 attempts |
| OTP purposes | `EMAIL_VERIFICATION` / `LOGIN_MFA` / `PASSWORD_RESET` |
| Login order | exist → active → locked → password → email verified → MFA → session |
| Email verification | Triggered at login if email_verified=False; continues login after success |
| MFA | OTP-based; /otp-verify?purpose=LOGIN_MFA |
| Password reset | OTP-based (not link-based); 3-step: request → verify OTP → submit new password |
| Post-login routing | SUPER_ADMIN → /dashboard; no BU → /no-business-unit; 1 BU → auto-select; 2+ BU → /select-business-unit |
| CSRF | /api/init/ MUST be called before login |
| Session invalidation | Password reset revokes ALL sessions across ALL devices |
| Audit | 14 distinct auth events logged immutably with correlation_id |

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE ARCHITECTURE REVIEW BOARD APPROVAL.

<!-- yss_orbit\rulebooks\F05 - AUTHENTICATION FLOWS (FRONTEND).md -->
# F05 - AUTHENTICATION FLOWS (FRONTEND)

**Version:** v4.0 ENTERPRISE FINAL
**Status:** PRODUCTION LAW
**Depends On:** F01, F04 (API Integration), B06 (Auth Backend Authority), F03 (State Management)
**Governance Role:** Frontend Authentication Flow Authority

---

## RULEBOOK OWNERSHIP

| Concern | Status |
|---------|--------|
| OWNS | Login UI flow, logout UI flow, token refresh UX, OTP verify page (shared across all three purposes), email verification UI flow, MFA OTP UI flow, password reset OTP UI flow, pending auth state management, post-login routing logic, session expiry UX, auth loading states |
| REFERENCES | B06 (all auth mechanics and contracts — backend authority), F04 (API client), F03 (auth state), F08 (route protection) |
| MUST NOT DUPLICATE | Auth mechanics (B06), token handling (B06), OTP generation (B06), session management (B06) |

---

## 1. PURPOSE

This rulebook defines **frontend authentication UX flows** for YSS Orbit.

The backend (B06) owns ALL authentication mechanics. This rulebook governs only the **UI flow, routing, and user experience** of authentication.

Frontend MUST NEVER handle raw tokens.
Frontend MUST NEVER make auth security decisions.
Frontend MUST NEVER generate or validate OTPs.

---

## 2. CORE GOVERNANCE LAWS

### 2.1 Token Storage (MANDATORY)

- Tokens MUST NOT be stored in `localStorage`, `sessionStorage`, or any JavaScript-accessible browser storage
- Auth tokens are stored in HttpOnly cookies by the backend — the frontend never sees them
- Frontend auth state MUST be limited to: `isAuthenticated`, `userId`, `permissions[]`, `allowedBusinessUnits[]`, `selectedBusinessUnitId`

**Violation:** Any token stored in browser-accessible storage = CRITICAL security breach.

### 2.2 CSRF Initialization Before Login (MANDATORY)

Before rendering the login form, the frontend MUST call:

```typescript
GET /api/init/
```

This initializes the CSRF cookie. Without this, `POST /api/login/` will fail with 403.

```typescript
// App startup — before login form renders:
useEffect(() => {
  apiClient.get('/api/init/').then(() => {
    setAppReady(true);
  });
}, []);
```

### 2.3 Login Flow (MANDATORY)

The login form collects `username` and `password`. On submit:

```typescript
async function handleLogin(credentials: { username: string; password: string }) {
  setIsLoading(true);
  setError(null);

  try {
    const response = await authApi.login(credentials);
    const { status, pending_user_id, pending_email } = response.data.data;

    switch (status) {
      case 'EMAIL_VERIFICATION_REQUIRED':
        // Store pending state (§2.12) and redirect to OTP verify page
        pendingAuthStore.set({ pendingUserId: pending_user_id, pendingEmail: pending_email, purpose: 'EMAIL_VERIFICATION' });
        router.navigate('/otp-verify?purpose=EMAIL_VERIFICATION');
        break;

      case 'MFA_OTP_SENT':
        pendingAuthStore.set({ pendingUserId: pending_user_id, purpose: 'LOGIN_MFA' });
        router.navigate('/otp-verify?purpose=LOGIN_MFA');
        break;

      case 'AUTHENTICATED':
        authStore.setFromLoginResponse(response.data.data);
        selectPostLoginRoute(response.data.data);  // §2.13
        break;
    }
  } catch (err) {
    const code = getErrorCode(err);
    switch (code) {
      case 'ACCOUNT_INACTIVE':
        setError('This account has been disabled. Please contact support.');
        break;
      case 'ACCOUNT_LOCKED':
        setError('This account has been locked due to too many failed attempts. Please contact support.');
        break;
      default:
        setError('Invalid username or password.');  // Generic — never reveal which
    }
  } finally {
    setIsLoading(false);
  }
}
```

Rules:
- Login button MUST be disabled during the API call (prevent double submission)
- Error messages MUST be generic for `INVALID_CREDENTIALS` — never reveal if username or password was wrong
- `ACCOUNT_INACTIVE` and `ACCOUNT_LOCKED` MAY show a support contact message

### 2.4 Logout Flow (MANDATORY)

```typescript
async function handleLogout() {
  try {
    await authApi.logout();   // Backend clears cookies
  } finally {
    // Always clear frontend state — even if API call fails
    authStore.clear();
    pendingAuthStore.clear();
    queryClient.clear();
    router.navigate('/login');
  }
}
```

Frontend state MUST be cleared even if the backend logout API fails.

### 2.5 Token Refresh UX (MANDATORY)

- Token refresh is handled silently in the API interceptor (F04)
- The user MUST NOT see token refresh in normal operation
- If refresh fails, the user MUST be redirected to login with a session expiry message:

```text
"Your session has expired. Please log in again."
```

### 2.6 Shared OTP Verify Page (MANDATORY)

A single page `/otp-verify` handles ALL three OTP purposes. The `purpose` query parameter determines the context.

```text
/otp-verify?purpose=EMAIL_VERIFICATION
/otp-verify?purpose=LOGIN_MFA
/otp-verify?purpose=PASSWORD_RESET
```

```typescript
const OtpVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const purpose = searchParams.get('purpose') as OtpPurpose;
  const { pendingUserId, pendingEmail, username } = pendingAuthStore.get();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_CONFIG: Record<OtpPurpose, { title: string; instruction: string }> = {
    EMAIL_VERIFICATION: {
      title: 'Verify Your Email',
      instruction: `Enter the 6-digit code sent to ${pendingEmail ?? 'your registered email'}.`,
    },
    LOGIN_MFA: {
      title: 'Two-Factor Authentication',
      instruction: 'Enter the 6-digit code sent to your registered email.',
    },
    PASSWORD_RESET: {
      title: 'Enter Reset Code',
      instruction: 'Enter the 6-digit code sent to your registered email.',
    },
  };

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    try {
      const payload =
        purpose === 'PASSWORD_RESET'
          ? { username, otp, purpose }
          : { pending_user_id: pendingUserId, otp, purpose };

      const response = await authApi.verifyOtp(payload);

      if (purpose === 'PASSWORD_RESET') {
        // Store reset_token in memory (NOT localStorage) for the next step
        pendingAuthStore.set({ resetToken: response.data.data.reset_token, purpose: 'PASSWORD_RESET' });
        router.navigate('/reset-password');
      } else {
        // EMAIL_VERIFICATION and LOGIN_MFA both return full auth payload on success
        authStore.setFromLoginResponse(response.data.data);
        pendingAuthStore.clear();
        selectPostLoginRoute(response.data.data);
      }
    } catch (err) {
      const code = getErrorCode(err);
      switch (code) {
        case 'OTP_EXPIRED':
          setError('This code has expired. Please go back and request a new one.');
          break;
        case 'OTP_MAX_ATTEMPTS_EXCEEDED':
          setError('Too many incorrect attempts. Please start over.');
          router.navigate('/login');
          break;
        default:
          setError('Invalid code. Please check and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const config = PAGE_CONFIG[purpose];
  return (
    <div>
      <h1>{config?.title}</h1>
      <p>{config?.instruction}</p>
      <OtpInput value={otp} onChange={setOtp} length={6} />
      {error && <p className="error">{error}</p>}
      <Button onClick={handleSubmit} disabled={otp.length !== 6 || isLoading}>
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </Button>
      <BackToLoginLink />
    </div>
  );
};
```

Rules:
- OTP input MUST be exactly 6 digits — submit button disabled until 6 digits entered
- OTP input MUST be numeric-only
- Back to Login link MUST be present on all three OTP pages

### 2.7 Email Verification UI Flow (MANDATORY)

Triggered when backend returns `status: EMAIL_VERIFICATION_REQUIRED` during login.

```text
1. Login → backend returns EMAIL_VERIFICATION_REQUIRED + pending_user_id + masked pending_email
2. Frontend stores { pendingUserId, pendingEmail, purpose: 'EMAIL_VERIFICATION' } (§2.12)
3. Frontend navigates → /otp-verify?purpose=EMAIL_VERIFICATION
4. OTP Verify Page shows: "Enter the 6-digit code sent to m***h@example.com"
5. User enters OTP → POST /api/verify-otp/ { pending_user_id, otp, purpose: 'EMAIL_VERIFICATION' }
6a. OTP valid   → backend verifies email, checks MFA, returns auth payload
                  frontend: selectPostLoginRoute()
6b. OTP invalid → show error, allow retry
6c. OTP expired → show message "Code expired. Please log in again." → redirect /login
```

After email verification succeeds, the backend handles next steps (MFA check). The frontend does NOT navigate back to `/login`.

### 2.8 MFA UI Flow (MANDATORY)

Triggered when backend returns `status: MFA_OTP_SENT` during login.

```text
1. Login → backend returns MFA_OTP_SENT + pending_user_id
2. Frontend stores { pendingUserId, purpose: 'LOGIN_MFA' } (§2.12)
3. Frontend navigates → /otp-verify?purpose=LOGIN_MFA
4. User enters OTP → POST /api/verify-otp/ { pending_user_id, otp, purpose: 'LOGIN_MFA' }
5a. OTP valid   → backend returns full auth payload
                  frontend: selectPostLoginRoute()
5b. OTP invalid → show "Invalid code. Please try again."
5c. OTP expired → show "Code expired." → redirect /login
```

MFA bypass is PROHIBITED. A user with MFA enabled MUST complete OTP verification before any protected route is accessible.

### 2.9 Password Reset UI Flow (MANDATORY)

The password reset flow is OTP-based — NOT link-based. There is no token in the URL.

```text
Step 1 — Forgot Password Page
  User enters: username
  POST /api/forgot-password/ { "username": "mahesh" }
  Frontend ALWAYS displays:
    "If this account exists, reset instructions have been sent to the registered email."
  (Never reveal if username exists or not)
  Frontend stores { username, purpose: 'PASSWORD_RESET' } (§2.12)
  Frontend navigates → /otp-verify?purpose=PASSWORD_RESET

Step 2 — OTP Verify Page (/otp-verify?purpose=PASSWORD_RESET)
  User enters: 6-digit OTP
  POST /api/verify-otp/ { "username": "mahesh", "otp": "123456", "purpose": "PASSWORD_RESET" }
  → OTP valid:
      backend returns { reset_token: "opaque-uuid" }
      frontend stores reset_token in memory (pendingAuthStore — NOT localStorage)
      frontend navigates → /reset-password
  → OTP invalid: show error, allow retry
  → OTP expired: show "Code expired. Please start over." → navigate /forgot-password

Step 3 — Reset Password Page (/reset-password)
  User enters: new_password, confirm_password
  Frontend validates: passwords match, basic strength check (UX only — backend validates for real)
  POST /api/reset-password/ { "reset_token": "...", "new_password": "...", "confirm_password": "..." }
  → Success:
      clear pendingAuthStore
      navigate /login
      show: "Password reset successfully. Please log in."
  → Error: show specific validation message (e.g., "Password does not meet requirements")
```

Rules:
- Forgot password page collects `username`, NOT email
- The generic response message is displayed regardless of whether the username exists
- `reset_token` is stored in in-memory `pendingAuthStore` ONLY — never in localStorage or URL
- Reset password page MUST redirect to `/login` if `pendingAuthStore` has no `reset_token` (direct navigation guard)

### 2.10 Session Expiry Handling (MANDATORY)

When the session expires (401 after failed refresh):
- Display a session-expiry dialog: `"Your session has expired. Please log in again."`
- Clear all auth state and pending auth state
- Redirect to login page
- Preserve the originally requested URL for post-login redirect

```typescript
function handleSessionExpiry(returnUrl: string) {
  authStore.clear();
  pendingAuthStore.clear();
  router.navigate(`/login?return=${encodeURIComponent(returnUrl)}`);
}
```

### 2.11 Loading States (MANDATORY)

- All auth API calls MUST display loading indicators
- Submit buttons MUST be disabled during API calls (prevent double submission)
- Loading state MUST be cleared on both success AND failure
- OTP input MUST be disabled while verification is in progress

### 2.12 Pending Auth State Management (MANDATORY)

During multi-step auth flows (email verification, MFA, password reset), the frontend needs to carry state between pages. This state is non-sensitive metadata — it is NOT tokens.

**Allowed storage:** In-memory React state (primary) OR `sessionStorage` (fallback for page-refresh resilience — permitted because this is non-token metadata).
**Prohibited:** `localStorage` for any auth-related state. Auth tokens in any browser-accessible storage.

```typescript
interface PendingAuthState {
  pendingUserId?: string;     // UUID — for EMAIL_VERIFICATION and LOGIN_MFA flows
  pendingEmail?: string;      // Masked email for display only
  username?: string;          // For PASSWORD_RESET flow
  purpose?: OtpPurpose;       // 'EMAIL_VERIFICATION' | 'LOGIN_MFA' | 'PASSWORD_RESET'
  resetToken?: string;        // Short-lived token from /verify-otp — for /reset-password
}

// Implementation: Zustand store backed by sessionStorage
const usePendingAuthStore = create<PendingAuthState & {
  set: (state: Partial<PendingAuthState>) => void;
  clear: () => void;
}>()(
  persist(
    (setState) => ({
      set: (state) => setState(state),
      clear: () => setState({ pendingUserId: undefined, pendingEmail: undefined,
                              username: undefined, purpose: undefined, resetToken: undefined }),
    }),
    { name: 'pending-auth', storage: createJSONStorage(() => sessionStorage) }
  )
);
```

Rules:
- `pendingAuthStore` MUST be cleared: after successful auth, on logout, on navigation to /login
- If `/otp-verify` is accessed without valid `pendingAuthStore` state, redirect to `/login`
- If `/reset-password` is accessed without `resetToken` in `pendingAuthStore`, redirect to `/forgot-password`
- `resetToken` stored in pendingAuthStore is a short-lived opaque server token (15 min TTL) — it is safe to store in sessionStorage since it cannot be used for account access, only for the single reset action

### 2.13 Post-Login Routing Logic (MANDATORY)

After successful authentication, the frontend MUST call `selectPostLoginRoute()` using the data returned in the auth payload.

```typescript
function selectPostLoginRoute(authData: AuthResponse): void {
  const { is_super_admin, allowed_business_units } = authData;

  // Case 1: Super Admin
  if (is_super_admin) {
    router.navigate('/dashboard');
    return;
  }

  // Case 2: No business units assigned
  if (!allowed_business_units || allowed_business_units.length === 0) {
    router.navigate('/no-business-unit');
    return;
  }

  // Case 3: Exactly one business unit → auto-select
  if (allowed_business_units.length === 1) {
    const bu = allowed_business_units[0];
    authStore.setSelectedBusinessUnit(bu.id);
    loadTenantContext(bu.id).then(() => {
      router.navigate('/dashboard');
    });
    return;
  }

  // Case 4: Multiple business units → user must select
  router.navigate('/select-business-unit');
}
```

Rules:
- `/no-business-unit` page MUST inform the user to contact their administrator
- `/select-business-unit` page MUST display all allowed BusinessUnits and allow selection
- After BU selection on `/select-business-unit`, navigate to `/dashboard`
- `is_super_admin` MUST be provided by backend — frontend MUST NOT compute this from role names
- Post-login routing MUST respect a `?return=` query param (redirect to originally requested page if present and safe)

---

## 3. SECURITY & COMPLIANCE

- Frontend MUST NOT intercept or read cookie values
- Auth errors MUST NOT reveal whether the username exists
- Login form MUST NOT auto-submit on page load
- OTP page MUST NOT auto-submit when 6 digits are entered (user must explicitly click Verify)
- `resetToken` MUST NOT be placed in the URL
- All auth state transitions MUST go through `authStore` and `pendingAuthStore` — never ad-hoc local state

---

## 4. NON-NEGOTIABLE RULES

- Tokens in localStorage/sessionStorage = CRITICAL violation
- Missing CSRF initialization before login = CRITICAL violation
- MFA bypass = PROHIBITED
- Frontend auth state not cleared on logout = HIGH violation
- Pending auth state not cleared on logout = HIGH violation
- Revealing username existence on forgot-password = PROHIBITED
- Password reset using URL link token (instead of OTP-based flow) = PROHIBITED
- resetToken placed in URL = PROHIBITED
- /otp-verify accessible without valid pendingAuthStore = PROHIBITED (must redirect to /login)
- /reset-password accessible without resetToken in pendingAuthStore = PROHIBITED
- Login error revealing whether username or password specifically was wrong = PROHIBITED
- Post-login routing not following §2.13 routing matrix = PROHIBITED

---

## 5. VIOLATIONS & ENFORCEMENT

| Severity | Action |
|---------|--------|
| CRITICAL | Block deployment |
| HIGH | Reject PR |
| MEDIUM | Fix required |

---

## 6. TESTING REQUIREMENTS

- Login flow — all status responses (AUTHENTICATED, EMAIL_VERIFICATION_REQUIRED, MFA_OTP_SENT) MUST be tested
- Login error messages — generic for INVALID_CREDENTIALS, support message for ACCOUNT_INACTIVE/LOCKED MUST be tested
- OTP verify page — valid, invalid, expired, max attempts MUST all be tested for each purpose
- Email verification flow (end-to-end UI) MUST be tested
- MFA flow (end-to-end UI) MUST be tested
- Password reset OTP flow (all 3 steps) MUST be tested
- Post-login routing — all 4 conditions (super admin, no BU, single BU, multiple BUs) MUST be tested
- Pending auth state — cleared on logout, cleared after success, guard redirects on direct navigation MUST be tested
- Logout — auth state cleared + redirect MUST be tested
- Session expiry redirect MUST be tested
- CSRF initialization MUST be tested
- Any failing test MUST block deployment

---

## 7. QUICK SUMMARY

| Flow | Route | Trigger |
|------|-------|---------|
| Login | `/login` | User initiates |
| Email verification OTP | `/otp-verify?purpose=EMAIL_VERIFICATION` | Backend: `EMAIL_VERIFICATION_REQUIRED` |
| MFA OTP | `/otp-verify?purpose=LOGIN_MFA` | Backend: `MFA_OTP_SENT` |
| Forgot password | `/forgot-password` | User initiates |
| Password reset OTP | `/otp-verify?purpose=PASSWORD_RESET` | After POST /api/forgot-password/ |
| New password | `/reset-password` | After OTP verified for PASSWORD_RESET |
| No BU | `/no-business-unit` | No business units assigned |
| BU selector | `/select-business-unit` | 2+ business units |
| Dashboard | `/dashboard` | SUPER_ADMIN or single/selected BU |

---

THIS RULEBOOK IS FINALIZED. ALL CHANGES REQUIRE FRONTEND ARCHITECT REVIEW.

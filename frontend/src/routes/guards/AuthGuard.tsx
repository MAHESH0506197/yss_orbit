// yss_orbit\frontend\src\app\guards\AuthGuard.tsx
/**
 * ⛔ DEPRECATED — DO NOT USE.
 *
 * C-2 / B06 §5.10 CRITICAL VIOLATION:
 * This file checked localStorage.getItem('access_token') to determine auth state.
 * localStorage tokens are readable by any JavaScript (XSS attack vector).
 *
 * ADDITIONALLY: AppRouter.tsx never imports from this file. It imports from:
 *   @/components/auth/AuthGuard (src/components/auth/AuthGuard.tsx)
 * That is the CANONICAL AuthGuard — it uses useAuthStore + /me/ session restore
 * via HttpOnly cookies. No localStorage involved.
 *
 * This file is a dead, broken duplicate. It is tombstoned to export nothing.
 * TODO(PROJ-003): Delete this file.
 */
export {};

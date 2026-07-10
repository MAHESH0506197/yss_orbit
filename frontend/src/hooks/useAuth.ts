// yss_orbit\frontend\src\hooks\useAuth.ts
/**
 * ⛔ DEPRECATED — DO NOT USE.
 *
 * 4.9 fix: This hook imported from the deprecated useAuthStore (localStorage tokens)
 * and called getAuthToken() which reads localStorage — CRITICAL B06 §5.10 violation.
 *
 * The canonical auth hooks are: @/features/iam/auth/hooks/useAuth
 * - useLogin() — TanStack mutation, HttpOnly cookie auth, B06 §5.19 routing matrix
 * - useLogout() — TanStack mutation, clears authStore, redirects
 * - useTokenRefresh() — TanStack mutation, cookie-based refresh
 *
 * The canonical auth state hook is: @/store/authStore
 * - useAuthStore() from Zustand, no persistence to localStorage
 */
export {};

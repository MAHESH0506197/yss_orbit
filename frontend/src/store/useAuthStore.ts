// yss_orbit\frontend\src\stores\useAuthStore.ts
/**
 * ⛔ DEPRECATED — DO NOT USE THIS FILE DIRECTLY.
 *
 * C-2 fix: B06 §5.10 CRITICAL VIOLATION REMEDIATED.
 * The original implementation of this store stored Bearer tokens in localStorage
 * via setAuthToken/removeAuthToken. This is a CRITICAL security violation.
 * localStorage tokens are accessible to any JavaScript on the page (XSS vulnerability).
 *
 * The ONLY correct auth mechanism for YSS Orbit is HttpOnly cookies managed by the backend.
 * The canonical auth store is: src/core/stores/authStore.ts
 *
 * This file is kept as a re-export tombstone to prevent import errors from any
 * remaining consumers while the codebase is migrated. All consumers MUST be
 * updated to import from '@/store/authStore' directly.
 */

// Re-export from the canonical store. Consumers should update their imports.
export { useAuthStore } from '@/store/authStore';

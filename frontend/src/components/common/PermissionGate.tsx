// yss_orbit\frontend\src\shared\components\PermissionGate.tsx
/**
 * ⛔ DEPRECATED — Re-exported from canonical location.
 *
 * 5.4 fix: This file had `const hasPermission = true` — always true regardless
 * of user permissions. Every gated element was always visible (security bypass).
 *
 * Canonical PermissionGate: @/components/auth/PermissionGate
 * Exports: PermissionGate, AllPermissionsGate, AnyPermissionGate
 * Uses: useAuthStore.hasPermission() with proper super-admin bypass.
 *
 * Update imports to use '@/components/auth/PermissionGate' directly.
 * TODO(PROJ-003): Remove this file after all consumers are migrated.
 */
export { PermissionGate, AllPermissionsGate, AnyPermissionGate } from '@/components/auth/PermissionGate';

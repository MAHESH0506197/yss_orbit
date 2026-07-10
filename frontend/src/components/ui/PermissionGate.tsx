// yss_orbit\frontend\src\components\ui\PermissionGate.tsx
/**
 * ⛔ DEPRECATED — Re-exported from canonical location.
 *
 * 5.4 fix: This file had `hasPermission = () => true` — always passes.
 * All permission-gated UI elements were always rendered (security bypass).
 *
 * Canonical PermissionGate: @/components/auth/PermissionGate
 * TODO(PROJ-003): Migrate consumers and remove this file.
 */
export { PermissionGate, AllPermissionsGate, AnyPermissionGate } from '@/components/auth/PermissionGate';

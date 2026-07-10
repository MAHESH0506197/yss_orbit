// yss_orbit\frontend\tests\authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../src/core/stores/authStore';

describe('authStore', () => {
  const initialAuthState = useAuthStore.getState();

  beforeEach(() => {
    useAuthStore.setState(initialAuthState, true);
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
    expect(state.username).toBeNull();
    expect(state.isSuperAdmin).toBe(false);
    expect(state.allowedBusinessUnits).toEqual([]);
    expect(state.permissions).toEqual([]);
  });

  it('should set authentication state correctly', () => {
    const authData = {
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isSuperAdmin: false,
      permissions: ['READ_ALL'],
      allowedBusinessUnits: [
        { business_unit_id: 'bu-1', name: 'BU 1', role_id: 'role-1', domain: 'domain1' }
      ]
    };

    useAuthStore.getState().setAuth(authData);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userId).toBe('user-1');
    expect(state.permissions).toEqual(['READ_ALL']);
    expect(state.selectedBusinessUnitId).toBe('bu-1'); // Auto-selected because length === 1
  });

  it('should clear authentication state', () => {
    const authData = {
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isSuperAdmin: false,
      permissions: ['READ_ALL'],
      allowedBusinessUnits: []
    };

    useAuthStore.getState().setAuth(authData);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userId).toBeNull();
  });

  it('should correctly evaluate hasPermission', () => {
    useAuthStore.getState().setAuth({
      userId: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isSuperAdmin: false,
      permissions: ['READ_ALL', 'WRITE_ALL'],
      allowedBusinessUnits: []
    });

    const state = useAuthStore.getState();
    expect(state.hasPermission('READ_ALL')).toBe(true);
    expect(state.hasPermission('DELETE_ALL')).toBe(false);
    expect(state.hasAnyPermission('DELETE_ALL', 'WRITE_ALL')).toBe(true);
    expect(state.hasAllPermissions('READ_ALL', 'WRITE_ALL')).toBe(true);
    expect(state.hasAllPermissions('READ_ALL', 'DELETE_ALL')).toBe(false);
  });

  it('should always allow permissions if superadmin', () => {
    useAuthStore.getState().setAuth({
      userId: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      isSuperAdmin: true,
      permissions: [], // No explicit permissions
      allowedBusinessUnits: []
    });

    const state = useAuthStore.getState();
    expect(state.hasPermission('ANY_PERMISSION')).toBe(true);
    expect(state.hasAnyPermission('PERM_1', 'PERM_2')).toBe(true);
    expect(state.hasAllPermissions('PERM_1', 'PERM_2')).toBe(true);
  });
});

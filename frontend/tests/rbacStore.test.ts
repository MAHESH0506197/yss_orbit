// yss_orbit\frontend\tests\rbacStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useRbacStore } from '../src/modules/rbac/state/rbacStore';

describe('rbacStore', () => {
  const initialState = useRbacStore.getState();

  beforeEach(() => {
    useRbacStore.setState(initialState, true);
  });

  it('should initialize with default values', () => {
    const state = useRbacStore.getState();
    expect(state.data).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should update data correctly', () => {
    const mockData = [{ id: 1, role: 'Admin' }];
    useRbacStore.getState().setData(mockData);
    
    expect(useRbacStore.getState().data).toEqual(mockData);
  });

  it('should update loading state', () => {
    useRbacStore.getState().setLoading(true);
    expect(useRbacStore.getState().loading).toBe(true);

    useRbacStore.getState().setLoading(false);
    expect(useRbacStore.getState().loading).toBe(false);
  });

  it('should update error state', () => {
    const errorMessage = 'Failed to fetch roles';
    useRbacStore.getState().setError(errorMessage);
    expect(useRbacStore.getState().error).toBe(errorMessage);
  });
});

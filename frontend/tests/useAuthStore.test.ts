// yss_orbit\frontend\tests\useAuthStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../src/stores/useAuthStore';
import { apiService } from '../src/services/apiService';
import * as utils from '../src/utils';

vi.mock('../src/services/apiService', () => ({
  apiService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}));

vi.mock('../src/utils', () => ({
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
}));

describe('useAuthStore', () => {
  const initialAuthState = useAuthStore.getState();

  beforeEach(() => {
    useAuthStore.setState(initialAuthState, true);
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', name: 'Test' };
    const mockResponse = { token: 'mock-token', user: mockUser };
    vi.mocked(apiService.login).mockResolvedValue(mockResponse);

    await useAuthStore.getState().login({ email: 'test@test.com', password: 'password' });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(utils.setAuthToken).toHaveBeenCalledWith('mock-token');
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    vi.mocked(apiService.login).mockRejectedValue({ response: { data: { message: errorMessage } } });

    await expect(useAuthStore.getState().login({ email: 'test@test.com', password: 'wrong' }))
      .rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it('should handle logout', async () => {
    vi.mocked(apiService.logout).mockResolvedValue();

    // Set initial logged in state
    useAuthStore.setState({ isAuthenticated: true, user: { id: '1', name: 'Test', email: 't@t.com', role: 'admin' } });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(utils.removeAuthToken).toHaveBeenCalled();
  });
});

// yss_orbit\frontend\src\tests\integration\userJourney.test.tsx
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  }
}));

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

import React from 'react';

import { AppRouter } from '@/routes/AppRouter';
import { ThemeProvider } from '@/utils/theme/ThemeProvider';
import * as apiClient from '@/api/client';
import { useAuthStore } from '@/store/authStore';


// Mock the API client
vi.mock('@/api/client', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  };
  return {
    api: mockApi,
    apiClient: mockApi,
    default: mockApi
  };
});

describe('User Authentication Journey', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <ThemeProvider>
            <AppRouter />
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('navigates from login to dashboard on successful login', async () => {
    // 1. Setup API mocks
    
    // AuthGuard calls /me to restore session, we mock it to fail (unauthenticated)
    const mockGet = async (url: string) => {
      if (url === '/me/') {
        return Promise.reject(new Error('Unauthorized'));
      }
      if (url === '/api/init/') {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: {} });
    };
    (apiClient.api.get as any).mockImplementation(mockGet);
    // @ts-expect-error
    if (apiClient.default?.get) { apiClient.default.get.mockImplementation(mockGet); }
    // @ts-expect-error
    if (apiClient.apiClient?.get) { apiClient.apiClient.get.mockImplementation(mockGet); }

    // Login calls /auth/login
    const mockPost = async (url: string) => {
      if (url === '/auth/login/') {
        return Promise.resolve({
          data: {
            status: 'AUTHENTICATED',
            user_id: '123',
            username: 'admin',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            permissions: [],
            business_units: [],
            is_super_admin: true
          }
        });
      }
      return Promise.resolve({});
    };
    (apiClient.api.post as any).mockImplementation(mockPost);
    // @ts-expect-error
    if (apiClient.default?.post) { apiClient.default.post.mockImplementation(mockPost); }
    // @ts-expect-error
    if (apiClient.apiClient?.post) { apiClient.apiClient.post.mockImplementation(mockPost); }

    // 2. Render App
    renderApp();

    // 3. Verify it redirects to Login page
    // 3. Verify it redirects to Login page
    const loginHeader = await screen.findByRole('heading', { name: /Welcome back/i }, { timeout: 5000 });
    expect(loginHeader).toBeInTheDocument();

    // 4. Fill login form
    const user = userEvent.setup();
    const usernameInput = screen.getByPlaceholderText(/Enter your username/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    
    await user.type(usernameInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');

    // 5. Submit form
    const loginButton = screen.getByRole('button', { name: /Sign in/i });
    await user.click(loginButton);

    // 6. Verify API was called
    await waitFor(() => {
      expect(apiClient.api.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'admin@example.com',
        password: 'password123'
      });
    });

    // 7. Verify navigation to dashboard
    // The AppRouter renders DashboardPage which has heading "Platform Dashboard"
    const dashboardHeader = await screen.findByRole('heading', { name: /Platform Dashboard/i }, { timeout: 20000 });
    expect(dashboardHeader).toBeInTheDocument();
  }, 30000);
});

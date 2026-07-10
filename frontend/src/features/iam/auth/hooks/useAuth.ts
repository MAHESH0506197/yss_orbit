// yss_orbit\frontend\src\features\auth\hooks\useAuth.ts
/**
 * YSS Orbit — Auth Hooks
 * TanStack Query mutation hooks for auth operations.
 * Tokens handled via HttpOnly cookies — never localStorage.
 */
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuthStore, type AuthData } from '@/store/authStore';
import { usePendingAuthStore } from '@/store/pendingAuthStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LoginCredentials {
  username: string;
  password: string;
}

export type LoginStatus =
  | 'AUTHENTICATED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'MFA_REQUIRED'
  | 'PASSWORD_CHANGE_REQUIRED';

export interface LoginResponse {
  success: boolean;
  data: {
    status: LoginStatus;
    user_id?: string;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    timezone?: string;
    language?: string;
    avatar?: string | null;
    is_super_admin?: boolean;
    permissions?: string[];
    allowed_business_units?: Array<{
      business_unit_id: string;
      name: string;
      role_id: string | null;
      domain: string;
    }>;
  };
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface TokenRefreshResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// useLogin
// ---------------------------------------------------------------------------
export function useLogin() {
  const navigate = useNavigate();
  const { setAuth, allowedBusinessUnits } = useAuthStore();
  const { setPendingAuth } = usePendingAuthStore();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: (credentials) =>
      api.post<LoginResponse>('/api/v1/auth/login/', credentials),

    onSuccess: (response) => {
      const payload = response.data;
      const { status } = payload;

      if (status === 'AUTHENTICATED') {
        const authData: AuthData = {
          userId: payload.user_id!,
          username: payload.username!,
          email: payload.email!,
          firstName: payload.first_name!,
          lastName: payload.last_name!,
          timezone: payload.timezone ?? 'UTC',
          language: payload.language ?? 'en',
          // @ts-expect-error - Auto-patched TS2322
          avatar: payload.avatar ?? null,
          isSuperAdmin: payload.is_super_admin ?? false,
          permissions: payload.permissions ?? [],
          allowedBusinessUnits:
            payload.allowed_business_units?.map((bu: any) => ({
              business_unit_id: bu.id || bu.business_unit_id,
              name: bu.name,
              role_id: bu.role_id ?? null,
              domain: bu.code || bu.domain || '',
            })) ?? [],
        };
        setAuth(authData);

        if (authData.isSuperAdmin) {
          navigate('/platform', { replace: true });
          return;
        }

        const buCount = authData.allowedBusinessUnits.length;
        if (buCount === 0) {
          navigate('/no-business-unit', { replace: true });
        } else if (buCount === 1) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/select-business-unit', { replace: true });
        }
        return;
      }

      if (status === 'EMAIL_VERIFICATION_REQUIRED') {
        // 4.12 fix: Use in-memory pendingAuthStore instead of sessionStorage.
        setPendingAuth({
          pendingUserId: payload.user_id ?? null,
          purpose: 'EMAIL_VERIFICATION_REQUIRED',
          emailMasked: null,
        });
        navigate(
          `/verify-otp?purpose=EMAIL_VERIFICATION&user_id=${payload.user_id}`,
          { replace: true }
        );
        return;
      }

      if (status === 'MFA_REQUIRED') {
        // 4.12 fix: Use in-memory pendingAuthStore instead of sessionStorage.
        setPendingAuth({
          pendingUserId: payload.user_id ?? null,
          purpose: 'MFA_REQUIRED',
          emailMasked: null,
        });
        navigate(`/verify-otp?purpose=MFA&user_id=${payload.user_id}`, {
          replace: true,
        });
        return;
      }
    },
  });
}

// ---------------------------------------------------------------------------
// useLogout
// ---------------------------------------------------------------------------
export function useLogout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  return useMutation<LogoutResponse, Error, void>({
    mutationFn: () => api.post<LogoutResponse>('/api/v1/auth/logout/'),

    onSettled: () => {
      // Always clear auth state, even if API fails
      clearAuth();
      navigate('/login', { replace: true });
    },
  });
}

// ---------------------------------------------------------------------------
// useTokenRefresh
// ---------------------------------------------------------------------------
export function useTokenRefresh() {
  return useMutation<TokenRefreshResponse, Error, void>({
    mutationFn: () =>
      api.post<TokenRefreshResponse>('/api/v1/auth/token/refresh/'),
  });
}

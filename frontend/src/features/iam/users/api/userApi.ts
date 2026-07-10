import { apiClient } from '@/api/client';
import type { 
  User, 
  UserCreatePayload, 
  UserUpdatePayload, 
  UserListParams,
  UserListResponse,
  UserListMeta
} from '../types/userTypes';

function unwrapSingle<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function unwrapList(response: any): UserListResponse {
  const envelope = response?.data;
  const payload = envelope?.data ?? envelope;
  const backendMeta = envelope?.meta ?? {};
  
  const meta: UserListMeta = {
    count: payload?.count ?? 0,
    total: backendMeta.total ?? payload?.count ?? 0,
    total_active: backendMeta.total_active ?? 0,
    total_inactive: backendMeta.total_inactive ?? 0,
    total_deleted: backendMeta.total_deleted ?? 0,
    page: backendMeta.page ?? 1,
    page_size: backendMeta.page_size ?? 20,
    total_pages: backendMeta.total_pages ?? (Math.ceil((payload?.count ?? 0) / 20) || 1),
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
  };

  return {
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    meta,
  };
}

export const userApi = {
  getAll: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await apiClient.get('/users/', { params });
    return unwrapList(response);
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}/`, { params: { is_deleted: 'all' } });
    return unwrapSingle<User>(response);
  },

  create: async (data: UserCreatePayload): Promise<User> => {
    const response = await apiClient.post('/users/', data);
    return unwrapSingle<User>(response);
  },

  update: async (id: string, data: UserUpdatePayload): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/`, data);
    return unwrapSingle<User>(response);
  },

  delete: async (id: string, reason?: string, hard?: boolean, confirmation_username?: string): Promise<void> => {
    const params = hard ? { hard: 'true' } : undefined;
    const data = { reason, confirmation_username };
    await apiClient.delete(`/users/${id}/`, { params, data });
  },

  restore: async (id: string, reason?: string): Promise<User> => {
    const response = await apiClient.post(`/users/${id}/restore/`, { reason });
    return unwrapSingle<User>(response);
  },
};

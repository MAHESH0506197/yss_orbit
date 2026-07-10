import { apiClient } from '@/api/client';
import { UserRole, UserRoleCreatePayload, UserRoleUpdatePayload, UserRoleListResponse } from '../types/userRoleTypes';

const USER_ROLES_URL = '/user-roles/';

function unwrapList(response: any): UserRoleListResponse {
  const envelope = response?.data;
  const payload = envelope?.data ?? envelope;
  return {
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    meta: envelope?.meta,
  };
}

function unwrapSingle(response: any): UserRole {
  const envelope = response?.data;
  return envelope?.data ?? envelope;
}

export const userRoleApi = {
  getMany: async (params?: Record<string, any>): Promise<UserRoleListResponse> => {
    const response = await apiClient.get(USER_ROLES_URL, { params });
    return unwrapList(response);
  },

  create: async (payload: UserRoleCreatePayload): Promise<UserRole> => {
    const response = await apiClient.post(USER_ROLES_URL, payload);
    return unwrapSingle(response);
  },

  update: async (id: string, payload: UserRoleUpdatePayload): Promise<UserRole> => {
    const response = await apiClient.patch(`${USER_ROLES_URL}${id}/`, payload);
    return unwrapSingle(response);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${USER_ROLES_URL}${id}/`);
  },

  restore: async (id: string): Promise<UserRole> => {
    const response = await apiClient.post(`${USER_ROLES_URL}${id}/restore/`);
    return unwrapSingle(response);
  },
};

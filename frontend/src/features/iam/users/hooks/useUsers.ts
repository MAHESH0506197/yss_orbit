import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import type { UserListParams } from '../types/userTypes';
import { api } from '@/api/client';
import type { PaginatedResponse } from '@/types/apiTypes';
import type { User } from '../types/userTypes';

export const USERS_QUERY_KEY = ['users'];

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: () => userApi.getAll(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });
}

export function useOrganizationUsers(organizationId?: string) {
  return useQuery({
    queryKey: ['organization-users', organizationId],
    queryFn: () => api.get<PaginatedResponse<User>>(`/users/?organization_id=${organizationId}`),
    enabled: !!organizationId,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRoleApi } from '../api/userRoleApi';
import { UserRoleCreatePayload, UserRoleUpdatePayload } from '../types/userRoleTypes';
import toast from 'react-hot-toast';

export const USER_ROLES_QUERY_KEY = ['user-roles'];

export function useUserRoles(params?: Record<string, any>) {
  return useQuery({
    queryKey: [...USER_ROLES_QUERY_KEY, params],
    queryFn: () => userRoleApi.getMany(params),
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: UserRoleCreatePayload) => userRoleApi.create(payload),
    onSuccess: (data) => {
      toast.success('Role assigned successfully');
      queryClient.invalidateQueries({ queryKey: USER_ROLES_QUERY_KEY });
      // Invalidate related user profile queries
      queryClient.invalidateQueries({ queryKey: ['users', data.user_id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to assign role';
      toast.error(message);
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserRoleUpdatePayload }) => userRoleApi.update(id, payload),
    onSuccess: (data) => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: USER_ROLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['users', data.user_id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to update role';
      toast.error(message);
    }
  });
}

export function useRevokeUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => userRoleApi.delete(id),
    onSuccess: () => {
      toast.success('Role revoked successfully');
      queryClient.invalidateQueries({ queryKey: USER_ROLES_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to revoke role';
      toast.error(message);
    }
  });
}

export function useRestoreUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => userRoleApi.restore(id),
    onSuccess: () => {
      toast.success('Role restored successfully');
      queryClient.invalidateQueries({ queryKey: USER_ROLES_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to restore role';
      toast.error(message);
    }
  });
}

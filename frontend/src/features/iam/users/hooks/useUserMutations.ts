import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { USERS_QUERY_KEY } from './useUsers';
import type { UserCreatePayload, UserUpdatePayload } from '../types/userTypes';

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreatePayload) => userApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdatePayload }) =>
      userApi.update(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...USERS_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, hard, confirmation_username }: { id: string; reason?: string; hard?: boolean; confirmation_username?: string }) => 
      userApi.delete(id, reason, hard, confirmation_username),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }); },
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => userApi.restore(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }); },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      userApi.update(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: USERS_QUERY_KEY }); },
  });
}

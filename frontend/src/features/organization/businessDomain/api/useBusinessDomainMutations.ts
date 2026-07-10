// src/features/organization/businessDomain/api/useBusinessDomainMutations.ts
// v2.0: Added permanentDelete mutation with confirmation_name support.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { BusinessDomain } from '../types/businessDomainTypes';
import { businessDomainKeys } from './useBusinessDomains';

type CreatePayload = Pick<BusinessDomain, 'name' | 'code' | 'description'> & { logo_url?: string | null; is_active?: boolean; reason?: string };
type UpdatePayload = Partial<CreatePayload> & { reason?: string };


export const useBusinessDomainMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const { data } = await apiClient.post<{ data: BusinessDomain }>('/api/v1/business-domains/', payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdatePayload }) => {
      const { data } = await apiClient.patch<{ data: BusinessDomain }>(`/api/v1/business-domains/${id}/`, payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.delete(`/api/v1/business-domains/${id}/`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await apiClient.post<{ data: BusinessDomain }>(`/api/v1/business-domains/${id}/restore/`, { reason });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await apiClient.post<{ data: BusinessDomain }>(`/api/v1/business-domains/${id}/upload-logo/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  /**
   * Permanently (hard) delete a domain.
   * Super admin only. Requires the exact domain name as confirmationName.
   */
  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ id, confirmationName }: { id: string; confirmationName: string }) => {
      await apiClient.delete(`/api/v1/business-domains/${id}/?hard=true`, {
        data: { confirmation_name: confirmationName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessDomainKeys.all() });
    },
  });

  return {
    createDomain:          createMutation.mutateAsync,
    updateDomain:          updateMutation.mutateAsync,
    deleteDomain:          deleteMutation.mutateAsync,
    restoreDomain:         restoreMutation.mutateAsync,
    uploadLogo:            uploadLogoMutation.mutateAsync,
    permanentDeleteDomain: permanentDeleteMutation.mutateAsync,
    isCreating:            createMutation.isPending,
    isUpdating:            updateMutation.isPending,
    isDeleting:            deleteMutation.isPending,
    isRestoring:           restoreMutation.isPending,
    isUploadingLogo:       uploadLogoMutation.isPending,
    isPermanentDeleting:   permanentDeleteMutation.isPending,
  };
};

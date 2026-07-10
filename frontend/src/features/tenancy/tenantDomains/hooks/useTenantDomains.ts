// src/features/tenancy/tenantDomains/hooks/useTenantDomains.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tenantDomainApi } from '../api/tenantDomainApi';
import { organizationKeys } from '@/features/organization/hooks/useOrganizations';
import type {
  TenantDomain,
  TenantDomainCreatePayload,
  TenantDomainUpdatePayload,
  TenantDomainListParams,
} from '../types/tenantDomainTypes';

export const DOMAIN_KEYS = {
  all: ['tenantDomains'] as const,
  lists: () => [...DOMAIN_KEYS.all, 'list'] as const,
  list: (params: TenantDomainListParams) => [...DOMAIN_KEYS.lists(), params] as const,
  details: () => [...DOMAIN_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DOMAIN_KEYS.details(), id] as const,
};

export function useTenantDomains(params: TenantDomainListParams = {}) {
  return useQuery({
    queryKey: DOMAIN_KEYS.list(params),
    queryFn: () => tenantDomainApi.getMany(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useTenantDomain(id: string) {
  return useQuery({
    queryKey: DOMAIN_KEYS.detail(id),
    queryFn: () => tenantDomainApi.getOne(id),
    enabled: Boolean(id),
  });
}

export function useCreateTenantDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantDomainCreatePayload) => tenantDomainApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
  });
}

export function useUpdateTenantDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TenantDomainUpdatePayload }) =>
      tenantDomainApi.update(id, payload),
    onSuccess: (data: TenantDomain) => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
      qc.setQueryData(DOMAIN_KEYS.detail(data.id), data);
      qc.invalidateQueries({ queryKey: organizationKeys.all() });
    },
  });
}

export function useDeleteTenantDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantDomainApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
  });
}

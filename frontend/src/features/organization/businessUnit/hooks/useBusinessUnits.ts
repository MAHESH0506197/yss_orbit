// apps/organization/businessUnit/hooks/useBusinessUnits.ts
// ENTERPRISE AUDIT FIXES:
//   SYNC-04: useDeleteBusinessUnit now accepts { id, reason? } matching all other delete hooks.
//   SYNC-05: useRestoreBusinessUnit now accepts { id, reason? } matching all other restore hooks.

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { businessUnitApi } from '../api/businessUnitApi';
import { organizationKeys } from '@/features/organization/hooks/useOrganizations';
import { businessDomainKeys } from '../../businessDomain/api/useBusinessDomains';
import type {
  BusinessUnit,
  BusinessUnitCreatePayload,
  BusinessUnitUpdatePayload,
  BusinessUnitListParams,
} from '../types/businessUnitTypes';

// ─── Query Key Factory ────────────────────────────────────────────────────────
export const BU_KEYS = {
  all:     ['businessUnits'] as const,
  lists:   () => [...BU_KEYS.all, 'list']            as const,
  list:    (p: BusinessUnitListParams) => [...BU_KEYS.lists(), p] as const,
  details: () => [...BU_KEYS.all, 'detail']           as const,
  detail:  (id: string) => [...BU_KEYS.details(), id] as const,
  meta:    () => [...BU_KEYS.all, 'meta']             as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────
export function useBusinessUnits(params: BusinessUnitListParams = {}) {
  return useQuery({
    queryKey: BU_KEYS.list(params),
    queryFn:  () => businessUnitApi.getMany(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 s
  });
}

export function useBusinessUnit(id: string) {
  return useQuery({
    queryKey: BU_KEYS.detail(id),
    queryFn:  () => businessUnitApi.getOne(id),
    enabled:  Boolean(id),
  });
}

export function useBusinessUnitMeta() {
  return useQuery({
    queryKey: BU_KEYS.meta(),
    queryFn:  () => businessUnitApi.getMeta(),
    staleTime: Infinity,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useCreateBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BusinessUnitCreatePayload) => businessUnitApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BU_KEYS.lists() });
      // Invalidate org list — business_units_count annotation changes on create
      qc.invalidateQueries({ queryKey: organizationKeys.lists() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.lists() });
    },
  });
}

export function useUpdateBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BusinessUnitUpdatePayload }) =>
      businessUnitApi.update(id, payload),
    onSuccess: (data: BusinessUnit) => {
      qc.invalidateQueries({ queryKey: BU_KEYS.lists() });
      qc.setQueryData(BU_KEYS.detail(data.id), data);
      // Invalidate org list — activity status or name changes may affect org display
      qc.invalidateQueries({ queryKey: organizationKeys.lists() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.lists() });
      qc.invalidateQueries({ queryKey: ['tenant-context'] });
    },
  });
}

export function useDeleteBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    // SYNC-04 FIX: Accept { id, reason? } object (was bare id string).
    // All other delete hooks accept this shape — BU was inconsistent.
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      businessUnitApi.delete(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BU_KEYS.lists() });
      // Invalidate org list — business_units_count annotation decrements on delete
      qc.invalidateQueries({ queryKey: organizationKeys.lists() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.lists() });
    },
  });
}

export function useRestoreBusinessUnit() {
  const qc = useQueryClient();
  return useMutation({
    // SYNC-05 FIX: Accept { id, reason? } object (was bare id string).
    // All other restore hooks accept this shape — BU was inconsistent.
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      businessUnitApi.restore(id, reason),
    onSuccess: (data: BusinessUnit) => {
      qc.invalidateQueries({ queryKey: BU_KEYS.lists() });
      qc.setQueryData(BU_KEYS.detail(data.id), data);
      // Invalidate org list — business_units_count annotation increments on restore
      qc.invalidateQueries({ queryKey: organizationKeys.lists() });
      qc.invalidateQueries({ queryKey: businessDomainKeys.lists() });
    },
  });
}

export function useUploadBusinessUnitLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      businessUnitApi.uploadLogo(id, file),
    onSuccess: (logoUrl: string, variables) => {
      qc.setQueryData<BusinessUnit>(BU_KEYS.detail(variables.id), (old) =>
        old ? { ...old, logo_url: logoUrl } : old,
      );
      qc.invalidateQueries({ queryKey: BU_KEYS.lists() });
    },
  });
}

// yss_orbit\frontend\src\features\userBusinessUnit\hooks\useUserBusinessUnits.ts
// D2: New React Query hooks replacing the Zustand store pattern.
// Matches the pattern used by useUsers, useBusinessUnits, useOrganizations.
// The old useUserBusinessUnit (Zustand wrapper) is kept as a legacy shim
// that will be cleaned up in a future session.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userBusinessUnitApi } from '../api/userBusinessUnitApi';
import type {
  UserBusinessUnitCreatePayload,
  UserBusinessUnitUpdatePayload,
  UserBusinessUnitMembership,
} from '../types/userBusinessUnitTypes';

// ── Query key factory ─────────────────────────────────────────────────────────
export const UBU_QUERY_KEYS = {
  all:    ['userBusinessUnits'] as const,
  list:   (params: Record<string, unknown>) => ['userBusinessUnits', 'list', params] as const,
  detail: (id: string)                       => ['userBusinessUnits', 'detail', id]  as const,
};

// ── Normalise raw API response → typed membership ─────────────────────────────
export function normaliseRawMembership(raw: any): UserBusinessUnitMembership {
  return {
    id:                 raw.id,
    user:               raw.user               ?? raw.user_id      ?? '',
    userEmail:          raw.user_email         ?? raw.userEmail    ?? '',
    userFullName:       raw.user_full_name     ?? raw.userFullName ?? '',
    businessUnit:       raw.business_unit      ?? raw.businessUnit ?? '',
    businessUnitName:   raw.business_unit_name ?? raw.businessUnitName ?? '',
    role:               raw.role               ?? null,
    roleName:           raw.role_name          ?? raw.roleName     ?? null,
    isActiveMembership: raw.is_active_membership ?? raw.isActiveMembership ?? false,
    effectiveFrom:      raw.effective_from     ?? raw.effectiveFrom ?? null,
    effectiveTo:        raw.effective_to       ?? raw.effectiveTo  ?? null,
    joinedAt:           raw.joined_at          ?? raw.joinedAt     ?? '',
    createdAt:          raw.created_at         ?? raw.createdAt    ?? '',
    updatedAt:          raw.updated_at         ?? raw.updatedAt    ?? '',
  };
}

// ── List ──────────────────────────────────────────────────────────────────────
export interface UBUListParams {
  page?:           number;
  page_size?:      number;
  search?:         string;
  user_id?:        string;
  business_unit_id?: string;
  is_active?:      boolean;
  ordering?:       string;
}

export function useUserBusinessUnits(params: UBUListParams = {}) {
  return useQuery({
    queryKey: UBU_QUERY_KEYS.list(params as Record<string, unknown>),
    queryFn:  async () => {
      const resp = await userBusinessUnitApi.getAll(params as any);
      // Normalise results
      const results: UserBusinessUnitMembership[] = (resp.data ?? []).map(normaliseRawMembership);
      return { results, meta: resp.meta ?? null };
    },
    staleTime: 30_000, // 30s — balance between freshness and request count
  });
}

// ── Detail ────────────────────────────────────────────────────────────────────
export function useUserBusinessUnit(id: string) {
  return useQuery({
    queryKey: UBU_QUERY_KEYS.detail(id),
    queryFn:  async () => normaliseRawMembership(await userBusinessUnitApi.getById(id)),
    enabled:  !!id,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────
export function useCreateUBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserBusinessUnitCreatePayload) => userBusinessUnitApi.create(payload),
    onSuccess: () => {
      toast.success('Membership created successfully.');
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? 'Failed to create membership.');
    },
  });
}

// ── Update (PATCH) ────────────────────────────────────────────────────────────
export function useUpdateUBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserBusinessUnitUpdatePayload }) =>
      userBusinessUnitApi.patch(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Membership updated.');
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.all });
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.detail(id) });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? 'Update failed.');
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function useDeleteUBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userBusinessUnitApi.delete(id),
    onSuccess: () => {
      toast.success('Membership removed.');
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? 'Delete failed.');
    },
  });
}

// ── Activate ──────────────────────────────────────────────────────────────────
export function useActivateUBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userBusinessUnitApi.activate(id),
    onSuccess: (_, id) => {
      toast.success('Membership activated.');
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.all });
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.detail(id) });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? 'Activation failed.');
    },
  });
}

// ── Deactivate ────────────────────────────────────────────────────────────────
export function useDeactivateUBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userBusinessUnitApi.deactivate(id),
    onSuccess: (_, id) => {
      toast.success('Membership deactivated.');
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.all });
      qc.invalidateQueries({ queryKey: UBU_QUERY_KEYS.detail(id) });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? err?.message ?? 'Deactivation failed.');
    },
  });
}

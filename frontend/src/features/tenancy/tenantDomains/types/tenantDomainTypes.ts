// src/features/tenancy/tenantDomains/types/tenantDomainTypes.ts
import { z } from 'zod';

export interface TenantDomain {
  id: string;
  business_unit_id: string | null;
  organization_id: string;
  organization_name?: string;
  name: string;
  is_verified: boolean;
  ssl_enabled: boolean;
  domain_status: 'pending' | 'verified' | 'failed';
  ssl_status: 'pending' | 'active' | 'failed';
  created_at: string;
  updated_at: string;
}

export const tenantDomainCreateSchema = z.object({
  business_unit_id: z.string().optional(),
  name: z.string()
    .min(1, 'Domain name is required')
    .regex(/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.(?!-)[a-zA-Z0-9-]{2,63}(?<!-)(\.[a-zA-Z0-9-]{2,63})*$/, 'Invalid FQDN'),
  domain_status: z.enum(['pending', 'verified', 'failed']).optional(),
  ssl_status: z.enum(['pending', 'active', 'failed']).optional(),
});

export type TenantDomainCreatePayload = z.infer<typeof tenantDomainCreateSchema>;

export type TenantDomainUpdatePayload = Partial<TenantDomainCreatePayload>;

export interface TenantDomainListParams {
  page?: number;
  page_size?: number;
  search?: string;
  business_unit_id?: string;
}

export interface TenantDomainListMeta {
  count: number;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
}

export interface TenantDomainListResponse {
  results: TenantDomain[];
  meta: TenantDomainListMeta;
}

export interface TenantDomainListParams {
  search?: string;
  business_unit_id?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  ssl_enabled?: boolean;
  page?: number;
  page_size?: number;
}

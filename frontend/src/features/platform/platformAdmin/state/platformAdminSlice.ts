// yss_orbit\frontend\src\modules\platformAdmin\state\platformAdminSlice.ts
import { StateCreator } from 'zustand';
import { Tenant } from '../types/platformAdminTypes';

export interface PlatformAdminSlice {
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
  metrics: any;
  setMetrics: (metrics: any) => void;
}

export const createPlatformAdminSlice: StateCreator<PlatformAdminSlice> = (set) => ({
  tenants: [],
  setTenants: (tenants) => set({ tenants }),
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
});

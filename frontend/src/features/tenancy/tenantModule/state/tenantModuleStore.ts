// yss_orbit\frontend\src\modules\tenantModule\state\tenantModuleStore.ts
import { create } from 'zustand';
import { TenantModuleSlice, createTenantModuleSlice } from './tenantModuleSlice';

export const useTenantModuleStore = create<TenantModuleSlice>((...a) => ({
  ...createTenantModuleSlice(...a),
}));

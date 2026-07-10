// yss_orbit\frontend\src\modules\tenantSettings\state\tenantSettingsStore.ts
import { create } from 'zustand';
import { TenantSettingsSlice, createTenantSettingsSlice } from './tenantSettingsSlice';

export const useTenantSettingsStore = create<TenantSettingsSlice>((...a) => ({
  ...createTenantSettingsSlice(...a),
}));

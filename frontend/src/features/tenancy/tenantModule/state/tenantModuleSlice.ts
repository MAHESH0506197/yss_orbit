// yss_orbit\frontend\src\modules\tenantModule\state\tenantModuleSlice.ts
import { StateCreator } from 'zustand';

export interface TenantModuleSlice {
  modules: any[];
  setModules: (modules: any[]) => void;
}

export const createTenantModuleSlice: StateCreator<TenantModuleSlice> = (set) => ({
  modules: [],
  setModules: (modules) => set({ modules }),
});

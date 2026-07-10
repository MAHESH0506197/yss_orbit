// yss_orbit\frontend\src\modules\moduleRegistry\state\moduleRegistrySlice.ts
import { StateCreator } from 'zustand';
import { ModuleRegistryItem } from '../types/moduleRegistryTypes';

export interface ModuleRegistrySlice {
  modules: ModuleRegistryItem[];
  setModules: (modules: ModuleRegistryItem[]) => void;
}

export const createModuleRegistrySlice: StateCreator<ModuleRegistrySlice> = (set) => ({
  modules: [],
  setModules: (modules) => set({ modules }),
});

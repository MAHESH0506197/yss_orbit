// yss_orbit\frontend\src\modules\moduleRegistry\state\moduleRegistryStore.ts
import { create } from 'zustand';
import { ModuleRegistrySlice, createModuleRegistrySlice } from './moduleRegistrySlice';

export const useModuleRegistryStore = create<ModuleRegistrySlice>((...a) => ({
  ...createModuleRegistrySlice(...a),
}));

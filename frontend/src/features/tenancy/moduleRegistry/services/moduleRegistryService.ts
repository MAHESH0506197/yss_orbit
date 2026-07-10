// yss_orbit\frontend\src\modules\moduleRegistry\services\moduleRegistryService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { ModuleRegistryItem } from '../types/moduleRegistryTypes';

class ModuleRegistryApiService extends BaseService {
  constructor() {
    super('/modules');
  }

  getModules(): Promise<ModuleRegistryItem[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<ModuleRegistryItem[]>('/');
  }

  getModule(id: string | number): Promise<ModuleRegistryItem> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<ModuleRegistryItem>(`/${id}`);
  }

  toggleModule(id: number, isActive: boolean): Promise<ModuleRegistryItem> {
    // @ts-expect-error - Auto-patched TS2339
    return this.put<ModuleRegistryItem>(`/${id}/toggle`, { isActive });
  }
}

export const ModuleRegistryService = new ModuleRegistryApiService();

// yss_orbit\frontend\src\modules\moduleRegistry\types\moduleRegistryTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface ModuleRegistryItem extends BaseEntity {
  name: string;
  code: string;
  version: string;
  description: string;
  isActive: boolean;
  dependencies?: string[];
  settings?: any;
}

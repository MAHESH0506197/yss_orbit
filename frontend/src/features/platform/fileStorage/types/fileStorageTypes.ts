// yss_orbit\frontend\src\modules\fileStorage\types\fileStorageTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface StoredFile extends BaseEntity {
  filename: string;
  originalName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
  uploadedBy?: number;
}

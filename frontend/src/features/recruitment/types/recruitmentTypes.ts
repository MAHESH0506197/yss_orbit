// yss_orbit\frontend\src\modules\recruitment\types\recruitmentTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface JobPosting extends BaseEntity {
  title: string;
  department: string;
  description: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  applicantCount: number;
}

// yss_orbit\frontend\src\modules\appraisal\types\appraisalTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface Appraisal extends BaseEntity {
  employeeId: number;
  managerId: number;
  period: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  score?: number;
  comments?: string;
}

export interface KPI extends BaseEntity {
  title: string;
  description: string;
  target: number;
  currentProgress: number;
  appraisalId: number;
}

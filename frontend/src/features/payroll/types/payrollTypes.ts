// yss_orbit\frontend\src\modules\payroll\types\payrollTypes.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseEntity } from '@/utils/core/types/commonTypes';

export interface PayrollRun extends BaseEntity {
  period: string;
  totalEmployees: number;
  processedEmployees: number;
  totalAmount: number;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
}

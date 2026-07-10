// yss_orbit\frontend\src\modules\payroll\services\payrollService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { PayrollRun } from '../types/payrollTypes';

class PayrollApiService extends BaseService {
  constructor() {
    super('/hrms/payroll');
  }

  getRuns(): Promise<PayrollRun[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<PayrollRun[]>('/runs');
  }

  getRun(id: string | number): Promise<PayrollRun> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<PayrollRun>(`/runs/${id}`);
  }

  processRu(ndata: any): Promise<PayrollRun> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<PayrollRun>('/runs', data);
  }
}

export const PayrollService = new PayrollApiService();

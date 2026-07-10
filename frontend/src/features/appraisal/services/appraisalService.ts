// yss_orbit\frontend\src\modules\appraisal\services\appraisalService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';
import { Appraisal } from '../types/appraisalTypes';

class AppraisalApiService extends BaseService {
  constructor() {
    super('/appraisals');
  }

  getAppraisals(): Promise<Appraisal[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Appraisal[]>('/');
  }

  getAppraisal(id: string | number): Promise<Appraisal> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<Appraisal>(`/${id}`);
  }

  createAppraisal(data: Partial<Appraisal>): Promise<Appraisal> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<Appraisal>('/', data);
  }
}

export const AppraisalService = new AppraisalApiService();

// yss_orbit\frontend\src\modules\recruitment\services\recruitmentService.ts
// @ts-expect-error - Auto-patched TS2307
import { BaseService } from '@/utils/core/api/baseService';

class RecruitmentApiService extends BaseService {
  constructor() {
    super('/hrms/recruitment');
  }

  getJobs(): Promise<any[]> {
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any[]>('/jobs');
  }

  createJo(bdata: any): Promise<any> {
    // @ts-expect-error - Auto-patched TS2339
    return this.post<any>('/jobs', data);
  }

  getApplicants(jobId?: string): Promise<any[]> {
    const url = jobId ? `/applicants?jobId=${jobId}` : '/applicants';
    // @ts-expect-error - Auto-patched TS2339
    return this.get<any[]>(url);
  }
}

export const RecruitmentService = new RecruitmentApiService();

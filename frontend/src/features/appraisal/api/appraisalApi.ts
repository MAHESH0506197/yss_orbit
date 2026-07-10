// yss_orbit\frontend\src\modules\appraisal\api\appraisalApi.ts
import api from '@/api/apiConfig';

export interface AppraisalDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const appraisalApi = {
  getAll: async (): Promise<AppraisalDto[]> => {
    const response = await api.get(`/api/v1/appraisal`);
    return response.data;
  },
  
  getById: async (id: string): Promise<AppraisalDto> => {
    const response = await api.get(`/api/v1/appraisal/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<AppraisalDto>): Promise<AppraisalDto> => {
    const response = await api.post(`/api/v1/appraisal`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<AppraisalDto>): Promise<AppraisalDto> => {
    const response = await api.put(`/api/v1/appraisal/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/appraisal/${id}`);
  }
};

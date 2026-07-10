// yss_orbit\frontend\src\modules\recruitment\api\recruitmentApi.ts
import api from '@/api/apiConfig';

export interface RecruitmentDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const recruitmentApi = {
  getAll: async (): Promise<RecruitmentDto[]> => {
    const response = await api.get(`/recruitment`);
    return response.data;
  },
  
  getById: async (id: string): Promise<RecruitmentDto> => {
    const response = await api.get(`/recruitment/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<RecruitmentDto>): Promise<RecruitmentDto> => {
    const response = await api.post(`/recruitment`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<RecruitmentDto>): Promise<RecruitmentDto> => {
    const response = await api.put(`/recruitment/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/recruitment/${id}`);
  }
};

// yss_orbit\frontend\src\modules\support\api\supportApi.ts
import api from '@/api/apiConfig';

export interface SupportDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const supportApi = {
  getAll: async (): Promise<SupportDto[]> => {
    const response = await api.get(`/support`);
    return response.data;
  },
  
  getById: async (id: string): Promise<SupportDto> => {
    const response = await api.get(`/support/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<SupportDto>): Promise<SupportDto> => {
    const response = await api.post(`/support`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<SupportDto>): Promise<SupportDto> => {
    const response = await api.put(`/support/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/support/${id}`);
  }
};

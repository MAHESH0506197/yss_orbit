// yss_orbit\frontend\src\modules\health\api\healthApi.ts
import api from '@/api/apiConfig';

export interface HealthDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const healthApi = {
  getAll: async (): Promise<HealthDto[]> => {
    const response = await api.get(`/health`);
    return response.data;
  },
  
  getById: async (id: string): Promise<HealthDto> => {
    const response = await api.get(`/health/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<HealthDto>): Promise<HealthDto> => {
    const response = await api.post(`/health`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<HealthDto>): Promise<HealthDto> => {
    const response = await api.put(`/health/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/health/${id}`);
  }
};

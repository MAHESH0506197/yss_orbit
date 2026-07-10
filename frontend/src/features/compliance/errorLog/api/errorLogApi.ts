// yss_orbit\frontend\src\modules\errorLog\api\errorLogApi.ts
import api from '@/api/apiConfig';

export interface ErrorlogDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const errorLogApi = {
  getAll: async (): Promise<ErrorlogDto[]> => {
    const response = await api.get(`/errorLog`);
    return response.data;
  },
  
  getById: async (id: string): Promise<ErrorlogDto> => {
    const response = await api.get(`/errorLog/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<ErrorlogDto>): Promise<ErrorlogDto> => {
    const response = await api.post(`/errorLog`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<ErrorlogDto>): Promise<ErrorlogDto> => {
    const response = await api.put(`/errorLog/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/errorLog/${id}`);
  }
};

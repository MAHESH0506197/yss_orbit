// yss_orbit\frontend\src\modules\observability\api\observabilityApi.ts
import api from '@/api/apiConfig';

export interface ObservabilityDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const observabilityApi = {
  getAll: async (): Promise<ObservabilityDto[]> => {
    const response = await api.get(`/observability`);
    return response.data;
  },
  
  getById: async (id: string): Promise<ObservabilityDto> => {
    const response = await api.get(`/observability/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<ObservabilityDto>): Promise<ObservabilityDto> => {
    const response = await api.post(`/observability`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<ObservabilityDto>): Promise<ObservabilityDto> => {
    const response = await api.put(`/observability/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/observability/${id}`);
  }
};

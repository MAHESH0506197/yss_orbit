// yss_orbit\frontend\src\modules\integration\api\integrationApi.ts
import api from '@/api/apiConfig';

export interface IntegrationDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const integrationApi = {
  getAll: async (): Promise<IntegrationDto[]> => {
    const response = await api.get(`/api/v1/integration`);
    return response.data;
  },
  
  getById: async (id: string): Promise<IntegrationDto> => {
    const response = await api.get(`/api/v1/integration/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<IntegrationDto>): Promise<IntegrationDto> => {
    const response = await api.post(`/api/v1/integration`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<IntegrationDto>): Promise<IntegrationDto> => {
    const response = await api.put(`/api/v1/integration/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/integration/${id}`);
  }
};

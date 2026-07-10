// yss_orbit\frontend\src\modules\featureFlags\api\featureFlagsApi.ts
import api from '@/api/apiConfig';

export interface FeatureflagsDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const featureFlagsApi = {
  getAll: async (): Promise<FeatureflagsDto[]> => {
    const response = await api.get(`/featureFlags`);
    return response.data;
  },
  
  getById: async (id: string): Promise<FeatureflagsDto> => {
    const response = await api.get(`/featureFlags/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<FeatureflagsDto>): Promise<FeatureflagsDto> => {
    const response = await api.post(`/featureFlags`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<FeatureflagsDto>): Promise<FeatureflagsDto> => {
    const response = await api.put(`/featureFlags/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/featureFlags/${id}`);
  }
};

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
    const response = await api.get(`/api/v1/featureFlags`);
    return response.data;
  },
  
  getById: async (id: string): Promise<FeatureflagsDto> => {
    const response = await api.get(`/api/v1/featureFlags/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<FeatureflagsDto>): Promise<FeatureflagsDto> => {
    const response = await api.post(`/api/v1/featureFlags`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<FeatureflagsDto>): Promise<FeatureflagsDto> => {
    const response = await api.put(`/api/v1/featureFlags/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/featureFlags/${id}`);
  }
};

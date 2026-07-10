// yss_orbit\frontend\src\features\moduleRegistry\api\moduleRegistryApi.ts
import api from '@/api/apiConfig';

export interface ModuleregistryDto {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_free: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const moduleRegistryApi = {
  getAll: async (): Promise<ModuleregistryDto[]> => {
    const response = await api.get(`/api/v1/subscription/platform-modules/`);
    // Assuming backend returns paginated response, handle accordingly
    return response.data.results || response.data;
  },
  
  getById: async (id: string): Promise<ModuleregistryDto> => {
    const response = await api.get(`/api/v1/subscription/platform-modules/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<ModuleregistryDto>): Promise<ModuleregistryDto> => {
    const response = await api.post(`/api/v1/subscription/platform-modules/`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<ModuleregistryDto>): Promise<ModuleregistryDto> => {
    const response = await api.patch(`/api/v1/subscription/platform-modules/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/moduleRegistry/${id}`);
  }
};

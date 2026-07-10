// yss_orbit\frontend\src\modules\tenantSettings\api\tenantSettingsApi.ts
import api from '@/api/apiConfig';

export interface TenantsettingsDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const tenantSettingsApi = {
  getAll: async (): Promise<TenantsettingsDto[]> => {
    const response = await api.get(`/api/v1/tenantSettings`);
    return response.data;
  },
  
  getById: async (id: string): Promise<TenantsettingsDto> => {
    const response = await api.get(`/api/v1/tenantSettings/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<TenantsettingsDto>): Promise<TenantsettingsDto> => {
    const response = await api.post(`/api/v1/tenantSettings`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<TenantsettingsDto>): Promise<TenantsettingsDto> => {
    const response = await api.put(`/api/v1/tenantSettings/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/tenantSettings/${id}`);
  }
};

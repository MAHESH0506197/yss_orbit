// yss_orbit\frontend\src\modules\branding\api\brandingApi.ts
import api from '@/api/apiConfig';

export interface BrandingDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const brandingApi = {
  getAll: async (): Promise<BrandingDto[]> => {
    const response = await api.get(`/api/v1/branding/`);
    return response.data;
  },
  
  getById: async (id: string): Promise<BrandingDto> => {
    const response = await api.get(`/api/v1/branding/${id}/`);
    return response.data;
  },
  
  create: async (data: Partial<BrandingDto>): Promise<BrandingDto> => {
    const response = await api.post(`/api/v1/branding/`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<BrandingDto>): Promise<BrandingDto> => {
    const response = await api.put(`/api/v1/branding/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/branding/${id}/`);
  }
};

export const fetchPublicTenantConfig = async () => {
  const response = await api.get(`/api/tenant-config/`);
  return response.data;
};

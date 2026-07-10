// yss_orbit\frontend\src\modules\audit\api\auditApi.ts
import api from '@/api/apiConfig';

export interface AuditDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const auditApi = {
  getAll: async (userId?: string): Promise<AuditDto[]> => {
    const url = userId ? `/api/v1/audit/?user_id=${userId}` : `/api/v1/audit`;
    const response = await api.get(url);
    return response.data.data; // The backend returns data paginated or wrapped in SuccessResponse
  },
  
  getById: async (id: string): Promise<AuditDto> => {
    const response = await api.get(`/api/v1/audit/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<AuditDto>): Promise<AuditDto> => {
    const response = await api.post(`/api/v1/audit`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<AuditDto>): Promise<AuditDto> => {
    const response = await api.put(`/api/v1/audit/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/audit/${id}`);
  }
};

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
    const url = userId ? `/audit/?user_id=${userId}` : `/audit`;
    const response = await api.get(url);
    return response.data.data; // The backend returns data paginated or wrapped in SuccessResponse
  },
  
  getById: async (id: string): Promise<AuditDto> => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<AuditDto>): Promise<AuditDto> => {
    const response = await api.post(`/audit`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<AuditDto>): Promise<AuditDto> => {
    const response = await api.put(`/audit/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/audit/${id}`);
  }
};

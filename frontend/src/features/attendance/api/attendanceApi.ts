// yss_orbit\frontend\src\modules\attendance\api\attendanceApi.ts
import api from '@/api/apiConfig';

export interface AttendanceDto {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const attendanceApi = {
  getAll: async (): Promise<AttendanceDto[]> => {
    const response = await api.get(`/attendance`);
    return response.data;
  },
  
  getById: async (id: string): Promise<AttendanceDto> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<AttendanceDto>): Promise<AttendanceDto> => {
    const response = await api.post(`/attendance`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<AttendanceDto>): Promise<AttendanceDto> => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/attendance/${id}`);
  }
};

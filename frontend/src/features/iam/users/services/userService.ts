// yss_orbit\frontend\src\modules\user\services\userService.ts
import axios from 'axios';

export const userService = {
  getAll: async () => {
    const response = await axios.get('/api/user');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await axios.get(`/api/user/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await axios.post('/api/user', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await axios.put(`/api/user/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axios.delete(`/api/user/${id}`);
    return response.data;
  }
};

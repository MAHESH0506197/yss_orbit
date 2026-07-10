import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\hrms\api.ts
import { apiClient } from '@/api/client';
import { Employee, EmployeeFilters } from './types';

class HrmsService {
  async getEmployees(params: EmployeeFilters): Promise<{ data: Employee[]; total: number }> {
    const response = await apiClient.get('/hrms/employees/', { params });
    return response.data;
  }

  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await apiClient.post('/hrms/employees/', employee);
    return response.data;
  }
}

export const hrmsService = new HrmsService();

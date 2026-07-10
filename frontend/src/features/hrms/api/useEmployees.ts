import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Employee, EmployeeFilters } from '../types/employeeTypes';

export interface EmployeesResponse {
  data: Employee[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    active: number;
    inactive: number;
    on_probation: number;
    resigned: number;
    new_joiners: number;
  };
}

export const useEmployees = (filters?: EmployeeFilters, options?: Omit<UseQueryOptions<EmployeesResponse>, 'queryKey' | 'queryFn'>) => {
  const buId = useAuthStore(state => state.selectedBusinessUnitId);
  return useQuery({
    queryKey: ['employees', filters, buId],
    queryFn: async () => {
      const { data } = await apiClient.get<EmployeesResponse>('/hrms/employees/', {
        params: filters,
      });
      return {
        data: data?.data ?? (data as any)?.results ?? [],
        meta: data?.meta ?? {
          total: 0,
          page: 1,
          page_size: 10,
          active: 0,
          inactive: 0,
          on_probation: 0,
          resigned: 0,
          new_joiners: 0
        },
      } as EmployeesResponse;
    },
    enabled: !!buId && (options?.enabled ?? true),
    ...options,
  });
};

export const useEmployee = (id: string, options?: Omit<UseQueryOptions<Employee>, 'queryKey' | 'queryFn'>) => {
  const buId = useAuthStore(state => state.selectedBusinessUnitId);
  return useQuery({
    queryKey: ['employee', id, buId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Employee }>(`/hrms/employees/${id}/`);
      return data?.data ?? (data as any);
    },
    enabled: !!id && !!buId && (options?.enabled ?? true),
    ...options,
  });
};

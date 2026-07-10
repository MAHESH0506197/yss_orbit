// yss_orbit\frontend\src\stores\useHrmsStore.ts
import { create } from 'zustand';
import { hrmsService } from '@/features/hrms/api';
import { Employee } from '@/features/hrms/types';

interface HrmsState {
  employees: Employee[];
  totalEmployees: number;
  isLoading: boolean;
  error: string | null;

  fetchEmployees: (page: number, limit: number) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
}

export const useHrmsStore = create<HrmsState>((set) => ({
  employees: [],
  totalEmployees: 0,
  isLoading: false,
  error: null,

  fetchEmployees: async (page, limit) => {
    set({ isLoading: true, error: null });
    try {
      const response = await hrmsService.getEmployees({ page, limit });
      set({ employees: response.data, totalEmployees: response.total, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch employees', isLoading: false });
    }
  },

  addEmployee: async (employee) => {
    set({ isLoading: true, error: null });
    try {
      const newEmployee = await hrmsService.createEmployee(employee);
      set(state => ({ 
        employees: [newEmployee, ...state.employees],
        totalEmployees: state.totalEmployees + 1,
        isLoading: false 
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to add employee', isLoading: false });
      throw err;
    }
  }
}));

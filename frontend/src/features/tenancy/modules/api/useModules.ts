import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export interface SystemModule {
  id: string;
  code: string;
  name: string;
  description: string;
  category_name: string;
  is_active: boolean;
  is_archived?: boolean;
  features: { id: string; code: string; name: string; description: string }[];
}

export interface ModuleStatistics {
  total_modules: number;
  core_modules: number;
  premium_modules: number;
  deprecated_modules: number;
}

export interface SystemModulesResponse {
  statistics: ModuleStatistics;
  modules: SystemModule[];
}

export function useSystemModules() {
  return useQuery({
    queryKey: ['system_modules'],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/modules/system/');
      return response.data as SystemModulesResponse;
    },
  });
}

export function useSubscribedModules() {
  return useQuery({
    queryKey: ['subscribed_modules'],
    queryFn: async () => {
      const response = await api.get<any>('/api/v1/modules/subscribed/');
      return response.data as string[];
    },
  });
}

export function useActivateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleCode: string) => {
      const response = await api.post<any>(`/api/v1/modules/${moduleCode}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribed_modules'] });
      queryClient.invalidateQueries({ queryKey: ['system_modules'] });
    },
  });
}

export function useDeactivateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (moduleCode: string) => {
      const response = await api.delete<any>(`/api/v1/modules/${moduleCode}/deactivate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribed_modules'] });
      queryClient.invalidateQueries({ queryKey: ['system_modules'] });
    },
  });
}

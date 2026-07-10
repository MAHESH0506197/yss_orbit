import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export const useTenantModules = (businessUnitId?: string) => {
  return useQuery({
    queryKey: ['tenant-modules', businessUnitId],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/tenant-module/');
      return res.data;
    },
    enabled: !!businessUnitId,
  });
};

export const useBusinessUnitSubscription = (buId?: string) => {
  return useQuery({
    queryKey: ['business-unit-subscription', buId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/subscription/business-units/${buId}/`);
      return res.data;
    },
    enabled: !!buId,
  });
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/subscription/plans/');
      return res.data;
    },
  });
};

export const useChangeBusinessUnitPlan = (buId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string, billingCycle: string }) => {
      const res = await apiClient.post(`/api/v1/subscription/business-units/${buId}/change-plan/`, {
        new_plan_id: planId,
        billing_cycle: billingCycle,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-unit-subscription', buId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules', buId] });
    },
  });
};

export const useCatalogModules = () => {
  return useQuery({
    queryKey: ['catalog-modules'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/catalog/modules/`);
      return res.data.results || res.data;
    },
  });
};

export const useCatalogModule = (id?: string) => {
  return useQuery({
    queryKey: ['catalog-module', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/catalog/modules/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateCatalogModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/api/v1/catalog/modules/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-modules'] });
      queryClient.invalidateQueries({ queryKey: ['system_modules'] });
    },
  });
};

export const useUpdateCatalogModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiClient.put(`/api/v1/catalog/modules/${id}/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-modules'] });
      queryClient.invalidateQueries({ queryKey: ['system_modules'] });
    },
  });
};

export const useDeleteCatalogModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/catalog/modules/${id}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-modules'] });
      queryClient.invalidateQueries({ queryKey: ['system_modules'] });
    },
  });
};

export const useCatalogCategories = () => {
  return useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      // TODO(PROJ-001): Re-enable once the backend catalog module is built.
      // const res = await apiClient.get(`/api/v1/catalog/categories/`);
      // return res.data.results || res.data;
      return [];
    },
  });
};

export const useCreateCatalogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/api/v1/catalog/categories/`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-categories'] }),
  });
};

export const useDirectAssignSubscription = (buId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/api/v1/subscription/business-units/${buId}/direct-assign/`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-unit-subscription', buId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-modules', buId] });
    },
  });
};

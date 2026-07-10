import os

hooks_code = """
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-modules'] }),
  });
};

export const useUpdateCatalogModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiClient.put(`/api/v1/catalog/modules/${id}/`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog-modules'] }),
  });
};

export const useCatalogCategories = () => {
  return useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/catalog/categories/`);
      return res.data.results || res.data;
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
"""

target = r"c:\PROJECT\yss_orbit\frontend\src\features\subscription\hooks\useSubscription.ts"
with open(target, 'a', encoding='utf-8') as f:
    f.write(hooks_code)

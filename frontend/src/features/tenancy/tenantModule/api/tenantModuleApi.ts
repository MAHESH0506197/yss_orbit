// yss_orbit\frontend\src\features\tenantModule\api\tenantModuleApi.ts
import api from '@/api/apiConfig';

export interface BusinessUnitModuleDto {
  id: string;
  module: {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    is_free: boolean;
    sort_order: number;
    depends_on: string[];
  };
  status: string; // "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED"
  is_active: boolean;
  plan_limit: any;
  trial_ends_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
}

export const tenantModuleApi = {
  getAll: async (businessUnitId: string): Promise<BusinessUnitModuleDto[]> => {
    if (!businessUnitId) return [];
    const response = await api.get(`/business-units/modules/?business_unit_id=${businessUnitId}`);
    return response.data.results || response.data.data || response.data;
  },
  
  activate: async (businessUnitId: string, moduleCode: string): Promise<BusinessUnitModuleDto> => {
    const response = await api.post(`/business-units/modules/activate/?business_unit_id=${businessUnitId}`, { module_code: moduleCode });
    return response.data.data || response.data;
  },
  
  deactivate: async (businessUnitId: string, moduleCode: string): Promise<BusinessUnitModuleDto> => {
    const response = await api.post(`/business-units/modules/deactivate/?business_unit_id=${businessUnitId}`, { module_code: moduleCode });
    return response.data.data || response.data;
  }
};

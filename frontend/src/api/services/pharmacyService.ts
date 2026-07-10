// yss_orbit\frontend\src\services\pharmacyService.ts
import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  stock: number;
  expiryDate: string;
  prescriptionRequired: boolean;
}

class PharmacyService {
  async getInventory(params: { page: number; limit: number }): Promise<{ data: Medication[]; total: number }> {
    const response = await apiClient.get('/pharmacy/inventory', { params });
    return response.data;
  }

  async dispenseMedication(id: string, quantity: number, prescriptionId?: string): Promise<void> {
    const response = await apiClient.post(`/pharmacy/dispense`, { id, quantity, prescriptionId });
    return response.data;
  }
}

export const pharmacyService = new PharmacyService();

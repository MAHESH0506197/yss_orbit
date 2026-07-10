// yss_orbit\frontend\src\services\posService.ts
import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  stock: number;
}

export interface Transaction {
  id: string;
  total: number;
  items: { productId: string; quantity: number }[];
  date: string;
}

class PosService {
  async getProducts(params: { page: number; limit: number; search?: string }): Promise<{ data: Product[]; total: number }> {
    const response = await apiClient.get('/pos/products', { params });
    return response.data;
  }

  async processTransaction(items: { productId: string; quantity: number }[]): Promise<Transaction> {
    const response = await apiClient.post('/pos/transactions', { items });
    return response.data;
  }
}

export const posService = new PosService();

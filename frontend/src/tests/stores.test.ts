// yss_orbit\frontend\src\tests\stores.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-expect-error - Auto-patched TS2307
import { usePosStore } from '../../src/stores/usePosStore';
// @ts-expect-error - Auto-patched TS2307
import { useHrmsStore } from '../../src/stores/useHrmsStore';
// @ts-expect-error - Auto-patched TS2307
import { posService } from '../../src/services/posService';
// @ts-expect-error - Auto-patched TS2307
import { hrmsService } from '../../src/services/hrmsService';

vi.mock('../../src/services/posService', () => ({
  posService: {
    getProducts: vi.fn(),
    processTransaction: vi.fn(),
  },
}));

vi.mock('../../src/services/hrmsService', () => ({
  hrmsService: {
    getEmployees: vi.fn(),
    createEmployee: vi.fn(),
  },
}));

describe('Zustand Stores with Complex Payloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePosStore.setState({ products: [], cart: [], isLoading: false, error: null, totalProducts: 0 });
    useHrmsStore.setState({ employees: [], isLoading: false, error: null, totalEmployees: 0 });
  });

  it('usePosStore can ingest complex JSON payloads for products without crashing', async () => {
    const mockComplexProducts = [
      {
        id: 'prod-123-uuid',
        name: 'Enterprise Router 5G - Advanced Edition',
        price: 299.99,
        barcode: '1234567890123',
        stock: 50,
        metadata: {
          category: 'Networking',
          manufacturer: 'TechCorp',
          tags: ['router', '5g', 'enterprise']
        },
        isActive: true,
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    (posService.getProducts as any).mockResolvedValue({
      data: mockComplexProducts,
      total: 1
    });

    await usePosStore.getState().fetchProducts(1, 10);
    const state = usePosStore.getState();
    
    expect(state.products.length).toBe(1);
    expect(state.products[0].id).toBe('prod-123-uuid');
    expect(state.products[0].name).toContain('Enterprise');
    // Ensure no crash and state updated
    expect(state.totalProducts).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('useHrmsStore can ingest complex JSON payloads for employees without crashing', async () => {
    const mockComplexEmployees = [
      {
        id: 'emp-999-uuid',
        firstName: 'Jane',
        lastName: 'Doe',
        department: 'Engineering',
        position: 'Senior Full Stack Developer',
        status: 'active',
        contact_info: {
          email: 'jane.doe@example.com',
          phone: '+1-555-0199',
          address: {
            street: '123 Tech Lane',
            city: 'Innovation City',
            country: 'US'
          }
        },
        salary_grade: 'L5',
        hire_date: '2022-03-15'
      }
    ];

    (hrmsService.getEmployees as any).mockResolvedValue({
      data: mockComplexEmployees,
      total: 1
    });

    await useHrmsStore.getState().fetchEmployees(1, 10);
    const state = useHrmsStore.getState();
    
    expect(state.employees.length).toBe(1);
    expect(state.employees[0].id).toBe('emp-999-uuid');
    expect(state.employees[0].department).toBe('Engineering');
    // Ensure no crash and state updated
    expect(state.totalEmployees).toBe(1);
    expect(state.isLoading).toBe(false);
  });
});

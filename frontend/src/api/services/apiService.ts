// yss_orbit\frontend\src\services\apiService.ts
import { apiClient } from '@/api/client'; // Migrated from tombstoned axiosClient (B06 §5.10)

// --- Interfaces ---

export interface LoginPayload {
  username: string;
  password?: string;
  ssoToken?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Branding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  faviconUrl?: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlags {
  [featureName: string]: boolean;
}

// --- API Service ---

class ApiService {
  // --- Authentication ---
  
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/', payload);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout/');
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me/');
    return response.data;
  }

  // --- Branding ---
  
  async getBranding(): Promise<Branding> {
    const response = await apiClient.get<Branding>('/branding/');
    return response.data;
  }

  // --- Business Units ---
  
  async getBusinessUnits(): Promise<BusinessUnit[]> {
    const response = await apiClient.get<any>('/business-units/');
    
    if (response.data?.data?.results) {
      return response.data.data.results;
    }
    if (response.data?.results) {
      return response.data.results;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  async getBusinessUnitById(id: string): Promise<BusinessUnit> {
    const response = await apiClient.get<BusinessUnit>(`/business-units/${id}/`);
    return response.data;
  }

  // --- Feature Flags ---
  
  async getFeatureFlags(): Promise<FeatureFlags> {
    const response = await apiClient.get<FeatureFlags>('/feature-flags/');
    return response.data;
  }
}

export const apiService = new ApiService();

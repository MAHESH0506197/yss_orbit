# yss_orbit\implement_frontend_targets.py
import os
import json
import re

TARGET_DIR = r"c:\PROJECT\yss_orbit"
AUDIT_FILE = os.path.join(TARGET_DIR, "deep_audit_results.json")

def get_module_name(file_path):
    match = re.search(r'modules[\\/]([^\\/]+)[\\/]', file_path)
    if match:
        return match.group(1)
    return "example"

def get_base_name(file_path):
    return os.path.basename(file_path).split('.')[0]

def generate_api_content(module_name):
    capitalized = module_name.capitalize()
    return f"""import api from '../../../platform/api/apiConfig';

export interface {capitalized}Dto {{
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}}

export const {module_name}Api = {{
  getAll: async (): Promise<{capitalized}Dto[]> => {{
    const response = await api.get(`/api/v1/{module_name}`);
    return response.data;
  }},
  
  getById: async (id: string): Promise<{capitalized}Dto> => {{
    const response = await api.get(`/api/v1/{module_name}/${{id}}`);
    return response.data;
  }},
  
  create: async (data: Partial<{capitalized}Dto>): Promise<{capitalized}Dto> => {{
    const response = await api.post(`/api/v1/{module_name}`, data);
    return response.data;
  }},
  
  update: async (id: string, data: Partial<{capitalized}Dto>): Promise<{capitalized}Dto> => {{
    const response = await api.put(`/api/v1/{module_name}/${{id}}`, data);
    return response.data;
  }},
  
  delete: async (id: string): Promise<void> => {{
    await api.delete(`/api/v1/{module_name}/${{id}}`);
  }}
}};
"""

def generate_hook_content(module_name):
    capitalized = module_name.capitalize()
    return f"""import {{ useState, useEffect, useCallback }} from 'react';
import {{ {module_name}Api, {capitalized}Dto }} from '../api/{module_name}Api';
import {{ logger }} from '../../../platform/telemetry/logger';

export const use{capitalized} = () => {{
  const [data, setData] = useState<{capitalized}Dto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {{
    setLoading(true);
    try {{
      const result = await {module_name}Api.getAll();
      setData(result);
      setError(null);
    }} catch (err: any) {{
      logger.error(`Error fetching {module_name}`, err);
      setError(err);
    }} finally {{
      setLoading(false);
    }}
  }}, []);

  useEffect(() => {{
    fetchAll();
  }}, [fetchAll]);

  return {{
    data,
    loading,
    error,
    refetch: fetchAll
  }};
}};
"""

def generate_utils_content(module_name):
    capitalized = module_name.capitalize()
    return f"""/**
 * Helper functions for {module_name} module
 */

export const format{capitalized}Data = (data: any) => {{
  if (!data) return null;
  return {{
    ...data,
    formattedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'
  }};
}};

export const validate{capitalized}Payload = (payload: any) => {{
  const errors: string[] = [];
  if (!payload) {{
    errors.push('Payload cannot be empty');
  }}
  return errors;
}};
"""

def generate_platform_api_config():
    return """import axios from 'axios';
import { storage } from '../storage/localStorageProvider';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = storage.getItem<string>('auth_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      storage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
"""

def generate_platform_api_registry():
    return """export const ApiRegistry = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
  },
  USERS: {
    BASE: '/api/v1/users',
    PROFILE: '/api/v1/users/profile',
  },
  TENANTS: {
    BASE: '/api/v1/tenants',
  }
};
"""

def generate_storage_provider(storage_type='localStorage'):
    provider = "window.localStorage" if storage_type == 'localStorage' else "window.sessionStorage"
    return f"""export const storage = {{
  getItem: <T>(key: string): T | null => {{
    try {{
      const item = {provider}.getItem(key);
      return item ? JSON.parse(item) : null;
    }} catch (error) {{
      console.error(`Error reading ${{key}} from {storage_type}`, error);
      return null;
    }}
  }},

  setItem: <T>(key: string, value: T): void => {{
    try {{
      {provider}.setItem(key, JSON.stringify(value));
    }} catch (error) {{
      console.error(`Error setting ${{key}} to {storage_type}`, error);
    }}
  }},

  removeItem: (key: string): void => {{
    try {{
      {provider}.removeItem(key);
    }} catch (error) {{
      console.error(`Error removing ${{key}} from {storage_type}`, error);
    }}
  }},

  clear: (): void => {{
    try {{
      {provider}.clear();
    }} catch (error) {{
      console.error(`Error clearing {storage_type}`, error);
    }}
  }}
}};
"""

def generate_logger():
    return """type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
"""

def generate_correlation_provider():
    return """export const generateCorrelationId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getCorrelationHeaders = () => {
  return {
    'X-Correlation-ID': generateCorrelationId(),
  };
};
"""

def generate_shared_constants(file_name):
    if 'appPermissions' in file_name:
        return """export enum AppPermissions {
  READ_USERS = 'READ_USERS',
  WRITE_USERS = 'WRITE_USERS',
  READ_TENANTS = 'READ_TENANTS',
  WRITE_TENANTS = 'WRITE_TENANTS',
  ADMIN = 'ADMIN'
}
"""
    elif 'appRoles' in file_name:
        return """export enum AppRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}
"""
    elif 'moduleConstants' in file_name:
        return """export const MODULE_REGISTRY = {
  BILLING: 'billing',
  DASHBOARD: 'dashboard',
  HRMS: 'hrmsCore',
  INVENTORY: 'inventory'
};
"""
    elif 'planConstants' in file_name:
        return """export enum SubscriptionPlans {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}
"""
    elif 'storageKeys' in file_name:
        return """export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  THEME_PREFERENCE: 'theme_preference',
  TENANT_ID: 'tenant_id'
};
"""
    return "export const DEFAULT_CONSTANT = 'DEFAULT';\n"

def generate_shared_hooks(file_name):
    base_name = get_base_name(file_name)
    if 'useBrandingContext' in file_name:
        return """import { useContext } from 'react';\n// Assuming a context exists\nexport const useBrandingContext = () => { return {}; };\n"""
    elif 'useBreakpoint' in file_name:
        return """import { useState, useEffect } from 'react';
export const useBreakpoint = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
};
"""
    elif 'useDebounce' in file_name:
        return """import { useState, useEffect } from 'react';
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
"""
    elif 'useModuleAccess' in file_name:
        return """import { usePermissions } from './usePermissions';
export const useModuleAccess = (moduleName: string) => {
  const { hasPermission } = usePermissions();
  return {
    canAccess: hasPermission(`ACCESS_${moduleName.toUpperCase()}`)
  };
};
"""
    elif 'usePagination' in file_name:
        return """import { useState } from 'react';
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  return { page, setPage, limit, setLimit, offset: (page - 1) * limit };
};
"""
    elif 'usePermissions' in file_name:
        return """import { useCallback } from 'react';
export const usePermissions = () => {
  const hasPermission = useCallback((permission: string) => {
    // Implement permission checking logic here
    return true;
  }, []);
  return { hasPermission };
};
"""
    elif 'useTenantContext' in file_name:
        return """import { useContext } from 'react';
// Assuming TenantContext is implemented elsewhere
export const useTenantContext = () => {
  return { tenantId: 'default-tenant' };
};
"""
    return f"export const {base_name} = () => {{ return null; }};\n"

def generate_shared_utils(file_name):
    if 'currencyUtils' in file_name:
        return """export const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};
"""
    elif 'dateUtils' in file_name:
        return """export const formatDate = (date: Date | string, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
};
"""
    elif 'formatUtils' in file_name:
        return """export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
"""
    elif 'objectUtils' in file_name:
        return """export const omit = <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};
"""
    elif 'stringUtils' in file_name:
        return """export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
"""
    return "export const utils = {};\n"

def generate_routes_content(file_name):
    if 'moduleAccessRoutes' in file_name:
        return """import { RouteObject } from 'react-router-dom';
export const moduleAccessRoutes: RouteObject[] = [
  // Define dynamic module routes here
];
"""
    elif 'ProtectedRoute' in file_name:
        return """import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
export const ProtectedRoute: React.FC<{ isAuthenticated: boolean; redirectPath?: string }> = ({ 
  isAuthenticated, 
  redirectPath = '/login' 
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};
"""
    elif 'PublicRoute' in file_name:
        return """import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
export const PublicRoute: React.FC<{ isAuthenticated: boolean; redirectPath?: string }> = ({ 
  isAuthenticated, 
  redirectPath = '/dashboard' 
}) => {
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};
"""
    elif 'ModuleRoute' in file_name:
        return """import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useModuleAccess } from '../shared/hooks/useModuleAccess';

export const ModuleRoute: React.FC<{ moduleName: string; fallbackPath?: string }> = ({ 
  moduleName,
  fallbackPath = '/unauthorized'
}) => {
  const { canAccess } = useModuleAccess(moduleName);
  
  if (!canAccess) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <Outlet />;
};
"""
    elif 'routeConstants' in file_name:
        return """export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  UNAUTHORIZED: '/unauthorized'
};
"""
    return ""

def generate_types(file_name):
    if 'global.d.ts' in file_name:
        return """declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}
export {};
"""
    elif 'index.d.ts' in file_name:
        return """declare module '*.svg' {
  const content: any;
  export default content;
}
declare module '*.png' {
  const content: any;
  export default content;
}
"""
    elif 'module.d.ts' in file_name:
        return """export interface BaseModuleConfig {
  id: string;
  name: string;
  isEnabled: boolean;
}
"""
    return ""

def generate_root_store():
    return """import { configureStore } from '@reduxjs/toolkit';
// Import reducers here

export const store = configureStore({
  reducer: {
    // Add reducers
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
"""

def generate_content(file_path):
    file_name = os.path.basename(file_path)
    if 'apiConfig' in file_name:
        return generate_platform_api_config()
    elif 'apiRegistry' in file_name:
        return generate_platform_api_registry()
    elif 'localStorageProvider' in file_name:
        return generate_storage_provider('localStorage')
    elif 'sessionStorageProvider' in file_name:
        return generate_storage_provider('sessionStorage')
    elif 'logger' in file_name:
        return generate_logger()
    elif 'correlationProvider' in file_name:
        return generate_correlation_provider()
    elif 'modules' in file_path.replace('\\', '/') and '/api/' in file_path.replace('\\', '/'):
        return generate_api_content(get_module_name(file_path))
    elif 'modules' in file_path.replace('\\', '/') and '/hooks/' in file_path.replace('\\', '/'):
        return generate_hook_content(get_module_name(file_path))
    elif 'modules' in file_path.replace('\\', '/') and '/utils/' in file_path.replace('\\', '/'):
        return generate_utils_content(get_module_name(file_path))
    elif 'shared' in file_path.replace('\\', '/') and '/constants/' in file_path.replace('\\', '/'):
        return generate_shared_constants(file_name)
    elif 'shared' in file_path.replace('\\', '/') and '/hooks/' in file_path.replace('\\', '/'):
        return generate_shared_hooks(file_name)
    elif 'shared' in file_path.replace('\\', '/') and '/utils/' in file_path.replace('\\', '/'):
        return generate_shared_utils(file_name)
    elif 'routes' in file_path.replace('\\', '/'):
        return generate_routes_content(file_name)
    elif 'types' in file_path.replace('\\', '/'):
        return generate_types(file_name)
    elif 'rootStore' in file_name:
        return generate_root_store()
    elif 'authStorage' in file_name:
        return """import { storage } from '../storage/localStorageProvider';
import { STORAGE_KEYS } from '../../shared/constants/storageKeys';

export const authStorage = {
  getToken: () => storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN),
  setToken: (token: string) => storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
  clearToken: () => storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
};
"""
    return None

def main():
    with open(AUDIT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    dir_targets = [
        '/api/', '/telemetry/', '/hooks/', '/constants/', '/storage/', '/utils/'
    ]
    
    file_targets = [
        'rootStore.ts', 'global.d.ts', 'index.d.ts', 'module.d.ts',
        'moduleAccessRoutes.ts', 'ProtectedRoute.tsx', 'PublicRoute.tsx', 'ModuleRoute.tsx'
    ]
    
    count = 0
    for item in data.get('incomplete_files', []):
        if item.get('category') != 'frontend':
            continue
            
        file_rel_path = item.get('file')
        file_rel_path_fwd = '/' + file_rel_path.replace('\\', '/').strip('/') + '/'
        file_name = os.path.basename(file_rel_path)
        
        match = False
        for t in dir_targets:
            if t in file_rel_path_fwd:
                match = True
                break
                
        if not match:
            for t in file_targets:
                if t == file_name:
                    match = True
                    break
                
        if match:
            abs_path = os.path.join(TARGET_DIR, file_rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            
            content = generate_content(file_rel_path)
            if content is not None:
                with open(abs_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(content)
                count += 1
                
    print(f"Updated {count} files.")

if __name__ == '__main__':
    main()

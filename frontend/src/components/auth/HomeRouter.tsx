import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTenantContext } from '@/store/context/TenantContext';

/**
 * YSS Orbit — Home Router
 * Intelligent root route (/) that calculates the exact landing page
 * a user should be directed to upon login based on their role, 
 * module subscriptions, and exact permissions.
 */
export default function HomeRouter() {
  const { isSuperAdmin, hasPermission } = useAuthStore();
  
  // Try to safely grab tenant context if it exists (it might not for super admins with no BU selected)
  let subscribedModules: string[] = [];
  try {
    const ctx = useTenantContext();
    subscribedModules = ctx.subscribedModules || [];
  } catch (e) {
    // If we're not inside the TenantContextProvider, or it fails, default to empty
  }

  // 1. Super Admins always get the Executive Dashboard or Organizations
  if (isSuperAdmin) {
    return <Navigate to="/platform" replace />;
  }

  // 2. Normal Users: Waterfall check based on subscribed modules AND permissions
  const hasModule = (m: string) => subscribedModules.includes(m);

  if (hasModule('pos') && hasPermission('pos.access')) {
    return <Navigate to="/pos" replace />;
  }
  
  if (hasModule('inventory') && hasPermission('inventory.view')) {
    return <Navigate to="/inventory" replace />;
  }
  
  if (hasModule('hrms') && hasPermission('hrms.employees.view')) {
    return <Navigate to="/hrms/employees" replace />;
  }

  if (hasModule('billing') && hasPermission('billing.view')) {
    return <Navigate to="/billing" replace />;
  }

  if (hasModule('customers') && hasPermission('customers.view')) {
    return <Navigate to="/customers" replace />;
  }

  // 3. Fallback if they have access to none of the core operational modules
  // but are authenticated (maybe a base employee just viewing their own profile)
  return <Navigate to="/dashboard" replace />;
}

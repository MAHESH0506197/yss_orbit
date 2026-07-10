import React from 'react';
import { Shield, ShieldCheck, Key } from 'lucide-react';
import type { User } from '@/features/iam/users/types/userTypes';

export function RoleBadge({ user }: { user: User }) {
  if (user.is_super_admin) return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
      <Shield className="h-3.5 w-3.5" /> Super Admin
    </span>
  );
  if ((user as any).is_platform_admin) return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm">
      <ShieldCheck className="h-3.5 w-3.5" /> Platform Admin
    </span>
  );
  if (user.is_staff) return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
      <Key className="h-3.5 w-3.5" /> Staff
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
      <Shield className="h-3.5 w-3.5" /> Member
    </span>
  );
}

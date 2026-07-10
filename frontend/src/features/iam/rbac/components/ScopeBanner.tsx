import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ScopeBannerProps {
  buName: string;
  isRoleContext?: boolean;
}

export const ScopeBanner: React.FC<ScopeBannerProps> = ({ buName, isRoleContext }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 mb-6">
      <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
      <p className="text-sm text-amber-800 dark:text-amber-400">
        {isRoleContext ? (
          <>Permissions apply only within <strong className="font-medium text-amber-900 dark:text-amber-300">{buName}</strong>. Users with this role have no access outside this unit.</>
        ) : (
          <>All roles below belong exclusively to <strong className="font-medium text-amber-900 dark:text-amber-300">{buName}</strong>. They do not apply to any other business unit.</>
        )}
      </p>
    </div>
  );
};

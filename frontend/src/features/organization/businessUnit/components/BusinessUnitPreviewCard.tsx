// apps/organization/businessUnit/components/BusinessUnitPreviewCard.tsx
// ENTERPRISE AUDIT: M-01 FIX — Extracted from BusinessUnitCreatePage and BusinessUnitEditPage.
// Shared live-preview card component to eliminate ~80-line duplication.

import React, { useState, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';

const LOCAL_HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

interface BusinessUnitPreviewCardProps {
  name: string;
  code: string;
  logoUrl?: string | null;
  isActive: boolean;
  primaryColor?: string;
  isMainBranch?: boolean;
  city?: string;
  country?: string;
  pendingFile: File | null;
}

export const BusinessUnitPreviewCard: React.FC<BusinessUnitPreviewCardProps> = ({
  name,
  code,
  logoUrl,
  isActive,
  primaryColor,
  isMainBranch,
  city,
  country,
  pendingFile,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
      return undefined;
    }
  }, [pendingFile]);

  const displayLogo = objectUrl || logoUrl;
  const hex = (primaryColor && LOCAL_HEX_REGEX.test(primaryColor)) ? primaryColor : '#4F46E5';

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${isActive ? 'border-violet-200 dark:border-violet-800' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-300`}>
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 transition-colors" style={{ backgroundColor: hex }} />

      <div className="relative z-10 flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm ${isActive ? 'border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-400' : 'border-gray-100 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800/50'}`}>
          {displayLogo ? (
            <img src={displayLogo} alt="Logo" className="h-full w-full rounded-xl object-contain p-1" />
          ) : (
            <Building2 className="h-6 w-6 opacity-50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className={`truncate font-bold text-base ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {name || 'Business Unit Name'}
            </h4>
            <div className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 tracking-widest">
              {code || 'CODE'}
            </code>
            {isMainBranch && (
              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 tracking-widest uppercase">
                HQ
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {city || 'City'}, {country || 'Country'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessUnitPreviewCard;

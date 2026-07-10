import React from 'react';

import { X, Globe2, Layers, Fingerprint, Calendar, Activity, CheckCircle2, XCircle, ShieldCheck, Lock, Clock } from 'lucide-react';
import { TenantDomain } from '../types/tenantDomainTypes';
import { formatIST } from '@/utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  domain?: TenantDomain | null;
}

export const TenantDomainViewModal: React.FC<Props> = ({ isOpen, onClose, domain }) => {
  if (!isOpen || !domain) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm transition-all" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 text-white">
                <Globe2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                  {domain.name}
                  {domain.domain_status === 'verified' ? (
                    <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800">Verified</span>
                  ) : domain.domain_status === 'failed' ? (
                    <span className="text-[10px] uppercase font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full ring-1 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800">Failed</span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800">Pending</span>
                  )}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5" /> ID: {domain.id}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Primary Details Card */}
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-violet-500" /> Domain Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Domain Name</span>
                    <div className="font-mono text-sm font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800/50 px-2.5 py-1 rounded-md inline-block">
                      {domain.name}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Verification Status</span>
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {domain.domain_status === 'verified' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : domain.domain_status === 'failed' ? <XCircle className="h-4 w-4 text-rose-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                      <span className="capitalize">{domain.domain_status}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">SSL Status</span>
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {domain.ssl_status === 'active' ? <Lock className="h-4 w-4 text-emerald-500" /> : domain.ssl_status === 'failed' ? <XCircle className="h-4 w-4 text-rose-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                      <span className="capitalize">{domain.ssl_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments / Metrics */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" /> Hierarchy Placement
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Organization</span>
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Layers className="h-3.5 w-3.5" /></div>
                      {domain.organization_name || domain.organization_id}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Business Unit ID</span>
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                      <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg"><Fingerprint className="h-3.5 w-3.5" /></div>
                      {domain.business_unit_id || <span className="text-gray-400 italic">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" /> System Tracking
                </h3>
                <div className="space-y-5">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Created At</span>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {domain.created_at ? formatIST(domain.created_at, 'PPP pp') : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Last Updated</span>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {domain.updated_at ? formatIST(domain.updated_at, 'PPP pp') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50 flex justify-end">
            <button onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white shadow-sm">
              Close
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

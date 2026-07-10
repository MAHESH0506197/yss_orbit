import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { useUpdateTenantDomain } from '../hooks/useTenantDomains';
import { tenantDomainCreateSchema, TenantDomain, TenantDomainUpdatePayload } from '../types/tenantDomainTypes';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface DomainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: TenantDomain | null;
}

export function DomainFormModal({ isOpen, onClose, domain }: DomainFormModalProps) {
  const updateMutation = useUpdateTenantDomain();
  const isBusy = updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TenantDomainUpdatePayload>({
    resolver: zodResolver(tenantDomainCreateSchema),
    defaultValues: {
      name: '',
      domain_status: 'pending',
      ssl_status: 'pending',
    },
  });

  useEffect(() => {
    if (isOpen && domain) {
      reset({
        name: domain.name,
        domain_status: domain.domain_status,
        ssl_status: domain.ssl_status,
      });
    }
  }, [isOpen, domain, reset]);

  const onSubmit = async (data: TenantDomainUpdatePayload) => {
    try {
      if (domain) {
        await updateMutation.mutateAsync({ id: domain.id, payload: {
          domain_status: data.domain_status,
          ssl_status: data.ssl_status
        } });
        toast.success('Domain status updated successfully');
      }
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.response?.data?.errors?.[0]?.detail || 'Failed to save domain';
      toast.error(errMsg);
    }
  };

  const inputCls = (hasError: boolean) => [
    'w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 shadow-sm',
    'placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500',
    hasError
      ? 'border-rose-400 bg-rose-50/30 dark:border-rose-700/50 dark:bg-rose-900/10'
      : 'border-gray-200 bg-white hover:border-gray-300 focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 focus:ring-1 focus:ring-indigo-500'
  ].join(' ');

  if (!domain) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => !isBusy && onClose()} title="Manage Domain Status">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
        
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">
            Domain Name (FQDN)
          </label>
          <input
            type="text"
            value={domain.name}
            disabled
            className={inputCls(false) + ' bg-gray-50 opacity-70'}
          />
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">
              Domain Verification Status
            </label>
            <select
              {...register('domain_status')}
              className={inputCls(!!errors.domain_status) + ' appearance-none'}
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">
              SSL Provisioning Status
            </label>
            <select
              {...register('ssl_status')}
              className={inputCls(!!errors.ssl_status) + ' appearance-none'}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy || !isDirty}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isBusy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              'Save Status'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

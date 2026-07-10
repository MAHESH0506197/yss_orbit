// yss_orbit/frontend/src/modules/organization/components/OrganizationFormModal.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X, Save, AlertCircle, Building2, Loader2, Mail, ImagePlus, Trash2, Upload,
  CheckCircle2, Zap, Phone, Globe2, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { Organization, OrganizationMeta } from '../types/organizationTypes';
import { useOrganizations, useUploadOrganizationLogo, useCreateOrganization, useUpdateOrganization, useUpdateOrganizationSettings } from '../hooks/useOrganizations';
import { LogoUploadZone } from './LogoUploadZone';
import { generateSlug, getAvatarColor, getOrgInitials } from '../utils/organizationHelpers';
import { useOrganizationUsers } from '@/features/iam/users/hooks/useUsers';
import { useBusinessDomains } from '@/features/organization/businessDomain/api/useBusinessDomains';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

// ─── Schema ───────────────────────────────────────────────────────────────────
const FQDN_REGEX = /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.(?!-)[a-zA-Z0-9-]{2,63}(?<!-)(\.[a-zA-Z0-9-]{2,63})*$/;

const getSchema = (meta?: OrganizationMeta) => z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name too long'),
  logo_url: z.union([z.string(), z.literal(''), z.null()]).optional(),
  is_active: z.boolean().default(true),
  email:    z.union([z.string().email('Must be a valid email'), z.literal('')]).optional(),
  phone:    z.union([z.string().max(50, 'Phone number too long'), z.literal('')]).optional(),
  headquarters_address_1: z.union([z.string().max(255), z.literal('')]).optional(),
  headquarters_address_2: z.union([z.string().max(255), z.literal('')]).optional(),
  city: z.union([z.string().max(100), z.literal('')]).optional(),
  state: z.union([z.string().max(100), z.literal('')]).optional(),
  country: z.union([z.string().max(100), z.literal('')]).optional(),
  postal_code: z.union([z.string().max(20), z.literal('')]).optional(),

  custom_domain: z.string().regex(FQDN_REGEX, 'Must be a valid FQDN (e.g. app.acme.com)').nullable().optional().or(z.literal('')),
  domain_status: z.enum(['pending', 'verified', 'failed']).optional(),
  ssl_status: z.enum(['pending', 'active', 'failed']).optional(),

  timezone: z.union([z.string().max(64), z.literal('')]).optional().default('Asia/Kolkata'),
  currency_code: z.union([z.string().max(3), z.literal('')]).optional().default('INR'),
  require_mfa: z.boolean().default(false),
  session_timeout_minutes: z.number().min(5).max(1440).default(60),
  enable_audit_log: z.boolean().default(true),
  enable_api_access: z.boolean().default(false),
  max_users: z.number().nullable().optional(),
  notify_on_login: z.boolean().default(false),
  notify_on_data_export: z.boolean().default(true),

  owner_id: z.string().nullable().optional(),
  business_domain_id: z.string().min(1, 'Please select a Business Domain'),
  reason: z.string().optional(),
});
type FormValues = z.infer<ReturnType<typeof getSchema>>;

// ─── Field Error ──────────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ─── Input class builders ─────────────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus-within:translate-x-[2px]',
    'placeholder:text-gray-400 focus:outline-none focus:ring-4 dark:text-white dark:placeholder:text-gray-500',
    hasError
      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700/50 dark:bg-rose-900/10'
      : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-gray-600 dark:focus:border-indigo-500',
  ].join(' ');
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 transition-transform duration-180 focus-within:translate-x-[2px]">
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  organization?: Organization | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OrganizationForm: React.FC<Props> = ({ organization, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const isEditing = Boolean(organization);
  const [logoFile, setLogoFile]       = useState<File | null>(null);

  const createMutation       = useCreateOrganization();
  const updateMutation       = useUpdateOrganization();
  const uploadLogoMutation   = useUploadOrganizationLogo();
  const updateSettingsMutation = useUpdateOrganizationSettings();
  const { data: metaRaw } = useOrganizations();
  const meta = metaRaw as any;
  const isBusy = createMutation.isPending || updateMutation.isPending || uploadLogoMutation.isPending || updateSettingsMutation.isPending;

  const schema = React.useMemo(() => getSchema(meta), [meta]);

  const {
    register, handleSubmit, reset, watch, setValue, control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', logo_url: '', is_active: true, email: '', phone: '', headquarters_address_1: '', headquarters_address_2: '', city: '', state: '', country: '', postal_code: '', custom_domain: '', owner_id: null, business_domain_id: '', timezone: 'Asia/Kolkata', currency_code: 'INR', require_mfa: false, session_timeout_minutes: 60, enable_audit_log: true, enable_api_access: false, max_users: null, notify_on_login: false, notify_on_data_export: true},
  });

  const { data: orgUsers, isLoading: isLoadingUsers } = useOrganizationUsers(organization?.id);
  const { data: domainsData, isLoading: isLoadingDomains } = useBusinessDomains({});
  const businessDomains = domainsData?.results || [];
  const nameWatch     = watch('name');
  const isActiveWatch = watch('is_active');
  const logoUrlWatch  = watch('logo_url');

  useEffect(() => {
    setLogoFile(null);
    if (organization) {
      reset({
        name:     organization.name,
        logo_url: organization.logo_url ?? '',
        is_active: organization.is_active,
        email:    organization.email ?? '',
        phone:    organization.phone ?? '',
        headquarters_address_1: organization.headquarters_address_1 ?? '',
        headquarters_address_2: organization.headquarters_address_2 ?? '',
        city:     organization.city ?? '',
        state:    organization.state ?? '',
        country:  organization.country ?? '',
        postal_code: organization.postal_code ?? '',
        owner_id: organization.owner_id ?? null,
        business_domain_id: organization.business_domain_id ?? '',
        timezone: organization.timezone ?? 'Asia/Kolkata',
        currency_code: organization.currency_code ?? 'INR',
        custom_domain: organization.settings?.custom_domain ?? '',
        domain_status: (organization.settings?.domain_status as any) ?? 'pending',
        ssl_status: (organization.settings?.ssl_status as any) ?? 'pending',
        require_mfa: organization.settings?.require_mfa ?? false,
        session_timeout_minutes: organization.settings?.session_timeout_minutes ?? 60,
        enable_audit_log: organization.settings?.enable_audit_log ?? true,
        enable_api_access: organization.settings?.enable_api_access ?? false,
        max_users: organization.settings?.max_users ?? null,
        notify_on_login: organization.settings?.notify_on_login ?? false,
        notify_on_data_export: organization.settings?.notify_on_data_export ?? true,
      });
    } else {
      reset({ name: '', logo_url: '', is_active: true, email: '', phone: '', headquarters_address_1: '', headquarters_address_2: '', city: '', state: '', country: '', postal_code: '', custom_domain: '', domain_status: 'pending', ssl_status: 'pending', owner_id: null, business_domain_id: '', timezone: 'Asia/Kolkata', currency_code: 'INR', require_mfa: false, session_timeout_minutes: 60, enable_audit_log: true, enable_api_access: false, max_users: null, notify_on_login: false, notify_on_data_export: true});
    }
  }, [organization, reset]);



  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        name:     data.name,
        is_active: data.is_active,
        logo_url: data.logo_url || null,
        owner_id: data.owner_id || null,
        business_domain_id: data.business_domain_id,
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.headquarters_address_1 && { headquarters_address_1: data.headquarters_address_1 }),
        ...(data.headquarters_address_2 && { headquarters_address_2: data.headquarters_address_2 }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.country && { country: data.country }),
        ...(data.postal_code && { postal_code: data.postal_code }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.currency_code && { currency_code: data.currency_code }),
        ...(data.reason && { reason: data.reason }),
      };

      if (isEditing && organization) {
        await updateMutation.mutateAsync({ id: organization.id, payload });
        
        // Update branding settings if needed
        const settingsUpdatePayload: any = {};

        settingsUpdatePayload.require_mfa = data.require_mfa;
        settingsUpdatePayload.session_timeout_minutes = data.session_timeout_minutes;
        settingsUpdatePayload.enable_audit_log = data.enable_audit_log;
        settingsUpdatePayload.enable_api_access = data.enable_api_access;
        settingsUpdatePayload.max_users = data.max_users;
        settingsUpdatePayload.notify_on_login = data.notify_on_login;
        settingsUpdatePayload.notify_on_data_export = data.notify_on_data_export;

        if (data.custom_domain !== (organization?.settings as any)?.custom_domain) {
          settingsUpdatePayload.custom_domain = data.custom_domain || '';
        }
        if (data.domain_status !== (organization?.settings as any)?.domain_status) {
          settingsUpdatePayload.domain_status = data.domain_status;
        }
        if (data.ssl_status !== (organization?.settings as any)?.ssl_status) {
          settingsUpdatePayload.ssl_status = data.ssl_status;
        }
        if (Object.keys(settingsUpdatePayload).length > 0) {
          try { await updateSettingsMutation.mutateAsync({ id: organization.id, payload: settingsUpdatePayload }); }
          catch { toast.error('Organization updated, but saving branding settings failed.'); }
        }

        if (logoFile) {
          try { await uploadLogoMutation.mutateAsync({ id: organization.id, file: logoFile }); }
          catch { toast.error('Organization updated, but logo upload failed.'); }
        }
        toast.success('Organization updated successfully!');
        onSuccess();
      } else {
        const createdOrg = await createMutation.mutateAsync(payload);
        
        // Update branding settings if a custom theme color or domain was chosen
        const settingsUpdatePayload: any = {};

        settingsUpdatePayload.require_mfa = data.require_mfa;
        settingsUpdatePayload.session_timeout_minutes = data.session_timeout_minutes;
        settingsUpdatePayload.enable_audit_log = data.enable_audit_log;
        settingsUpdatePayload.enable_api_access = data.enable_api_access;
        settingsUpdatePayload.max_users = data.max_users;
        settingsUpdatePayload.notify_on_login = data.notify_on_login;
        settingsUpdatePayload.notify_on_data_export = data.notify_on_data_export;

        if (data.custom_domain) settingsUpdatePayload.custom_domain = data.custom_domain;
        if (data.domain_status) settingsUpdatePayload.domain_status = data.domain_status;
        if (data.ssl_status) settingsUpdatePayload.ssl_status = data.ssl_status;
        
        if (Object.keys(settingsUpdatePayload).length > 0) {
          try { await updateSettingsMutation.mutateAsync({ id: createdOrg.id, payload: settingsUpdatePayload }); }
          catch { toast.error('Organization created, but saving branding settings failed.'); }
        }

        if (logoFile) {
          try { await uploadLogoMutation.mutateAsync({ id: createdOrg.id, file: logoFile }); }
          catch { toast.error('Organization created, but logo upload failed.'); }
        }
        toast.success(t('organization.form.success_create', 'Organization created successfully.'));
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t('error.something_went_wrong', 'Something went wrong'));
    }
  };

  return (
    <div className="flex w-full max-w-3xl mx-auto flex-col rounded-2xl bg-white shadow-sm dark:bg-gray-900 border border-gray-200 dark:border-gray-800">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {nameWatch ? (
                  <div
                    key={getOrgInitials(nameWatch)}
                    className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-white select-none shadow-lg animate-[scaleIn_0.25s_ease-out_both]"
                    style={{
                      background: `linear-gradient(135deg, ${getAvatarColor(nameWatch).bg} 0%, ${getAvatarColor(nameWatch).text}88 100%)`,
                      fontSize: '14px',
                      boxShadow: `0 4px 14px ${getAvatarColor(nameWatch).bg}55`,
                    }}
                  >
                    {getOrgInitials(nameWatch)}
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-sm">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditing ? t('organization.edit', 'Edit Organization') : t('organization.new', 'New Organization')}
                  </h2>
                  {isEditing && organization?.name && (
                    <p className="text-xs font-medium text-gray-500">
                      {organization.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onCancel}
                disabled={isBusy}
                aria-label="Close modal"
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto">
              <form id="org-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5 p-6">
                  <div className="col-span-2">
                    <Field label={t('organization.form.name', 'Organization Name')} required error={errors.name?.message}>
                      <input
                        {...register('name')}
                        placeholder={t('organization.form.name_placeholder', 'e.g. Acme Corporation')}
                        className={inputCls(!!errors.name)}
                      />
                    </Field>
                  </div>

                  <div className="col-span-2">
                    <Field 
                      label={t('organization.form.business_domain', 'Business Domain')} 
                      required 
                      error={errors.business_domain_id?.message}
                      hint={t('organization.form.business_domain_hint', 'The domain this organization belongs to.')}
                    >
                      <select
                        {...register('business_domain_id')}
                        className={inputCls(!!errors.business_domain_id)}
                        disabled={isLoadingDomains || (organization?.business_units_count ?? 0) > 0}
                      >
                        <option value="">-- Select a Business Domain --</option>
                        {isLoadingDomains ? (
                          <option value="" disabled>Loading domains...</option>
                        ) : (
                          domainsData?.results?.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                          ))
                        )}
                      </select>
                    </Field>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Field 
                      label={t('organization.form.email', 'Notification Email')} 
                      error={errors.email?.message}
                      hint={t('organization.form.email_hint', 'Primary contact for system alerts.')}
                    >
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          {...register('email')}
                          type="email"
                          placeholder={t('organization.form.email_placeholder', 'admin@example.com')}
                          className={`${inputCls(!!errors.email)} pl-9`}
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <Field 
                      label={t('organization.form.phone', 'Contact Number')} 
                      error={errors.phone?.message}
                      hint={t('organization.form.phone_hint', 'Primary contact phone number.')}
                    >
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          {...register('phone')}
                          type="tel"
                          placeholder={t('organization.form.phone_placeholder', '+1 (555) 000-0000')}
                          className={`${inputCls(!!errors.phone)} pl-9`}
                        />
                      </div>
                    </Field>
                  </div>

                  {/* ─── CORPORATE INFORMATION ─────────────────────────────────── */}
                  <div className="col-span-2 pt-4 pb-2 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                      Headquarters Address
                    </h3>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <div className="col-span-2">
                        <Field label="Address Line 1" error={errors.headquarters_address_1?.message}>
                          <input
                            {...register('headquarters_address_1')}
                            type="text"
                            placeholder="Corporate office, street address"
                            className={inputCls(!!errors.headquarters_address_1)}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="Address Line 2 (Optional)" error={errors.headquarters_address_2?.message}>
                          <input
                            {...register('headquarters_address_2')}
                            type="text"
                            placeholder="Suite, unit, building, floor, etc."
                            className={inputCls(!!errors.headquarters_address_2)}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="City" error={errors.city?.message}>
                          <input
                            {...register('city')}
                            type="text"
                            placeholder="City"
                            className={inputCls(!!errors.city)}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="State / Province" error={errors.state?.message}>
                          <input
                            {...register('state')}
                            type="text"
                            placeholder="State"
                            className={inputCls(!!errors.state)}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="Postal / Zip Code" error={errors.postal_code?.message}>
                          <input
                            {...register('postal_code')}
                            type="text"
                            placeholder="ZIP Code"
                            className={inputCls(!!errors.postal_code)}
                          />
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="Country" error={errors.country?.message}>
                          <input
                            {...register('country')}
                            type="text"
                            placeholder="Country"
                            className={inputCls(!!errors.country)}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* ─── BRANDING & IDENTITY ─────────────────────────────────── */}
                  <div className="col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                      Branding & Identity
                    </h3>
                    


                    <div className="space-y-4 mb-6">
                      <div className="flex gap-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/15 p-4 text-sm">
                        <Info className="h-5 w-5 shrink-0 mt-0.5 text-violet-600 dark:text-violet-400" />
                        <div className="text-violet-700 dark:text-violet-300 space-y-1">
                          <h4 className="font-bold">Understanding Domains</h4>
                          <p className="text-xs opacity-90">
                            <strong>Custom Domain:</strong> Your own dedicated address (e.g. <code className="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded font-mono">portal.acmecorp.com</code>). Requires DNS verification.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                        {/* Custom domain */}
                        <div className="col-span-1 sm:col-span-2">
                          <Field 
                            label="Custom Domain (Optional)" 
                            error={errors.custom_domain?.message}
                          >
                            <div className="relative">
                              <Globe2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                {...register('custom_domain')}
                                placeholder="portal.example.com"
                                className={`${inputCls(!!errors.custom_domain)} pl-10`}
                              />
                            </div>
                          </Field>
                          
                          {/* Domain & SSL Status (Only show if custom domain is provided) */}
                          {watch('custom_domain') && (
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                              <Field label="Domain Status">
                                <select {...register('domain_status')} className={inputCls(false)}>
                                  <option value="pending">Pending</option>
                                  <option value="verified">Verified</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </Field>
                              <Field label="SSL Status">
                                <select {...register('ssl_status')} className={inputCls(false)}>
                                  <option value="pending">Pending</option>
                                  <option value="active">Active</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </Field>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-200">
                      Organization Logo
                    </label>
                    <LogoUploadZone
                      orgId={organization?.id}
                      currentLogoUrl={watch('logo_url') ?? null}
                      onUploaded={(url) => setValue('logo_url', url, { shouldValidate: true })}
                      onFileSelected={setLogoFile}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      {t('organization.form.logo_hint', 'Max 5MB. PNG, JPG or SVG.')}
                    </p>
                  </div>

                  {/* ─── ORGANIZATION SETTINGS ───────────────────────────────── */}
                  <div className="col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                      Organization Settings
                    </h3>
                    <div className="grid gap-5 grid-cols-2">
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <label className="text-sm font-bold text-gray-900 dark:text-white">Require MFA</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Enforce MFA for all users.</p>
                        </div>
                        <input type="checkbox" {...register('require_mfa')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <Field label="Session Timeout (Minutes)" error={errors.session_timeout_minutes?.message}>
                          <input type="number" {...register('session_timeout_minutes', { valueAsNumber: true })} className={inputCls(!!errors.session_timeout_minutes)} min="5" max="1440" />
                        </Field>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <label className="text-sm font-bold text-gray-900 dark:text-white">Audit Log</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Enable system audit logging.</p>
                        </div>
                        <input type="checkbox" {...register('enable_audit_log')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <label className="text-sm font-bold text-gray-900 dark:text-white">API Access</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Allow programmatic API access.</p>
                        </div>
                        <input type="checkbox" {...register('enable_api_access')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <label className="text-sm font-bold text-gray-900 dark:text-white">Login Alerts</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notify on every login.</p>
                        </div>
                        <input type="checkbox" {...register('notify_on_login')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <label className="text-sm font-bold text-gray-900 dark:text-white">Export Alerts</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Notify on data export.</p>
                        </div>
                        <input type="checkbox" {...register('notify_on_data_export')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" />
                      </div>
                      <div className="col-span-2">
                        <Field label="Max Users" error={errors.max_users?.message}>
                          <input type="number" {...register('max_users', { setValueAs: v => (v === "" || v === null || Number.isNaN(v)) ? null : parseInt(v, 10) })} className={inputCls(!!errors.max_users)} placeholder="Leave blank for unlimited" />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800 rounded-2xl border bg-gray-50/50 p-4 dark:bg-gray-800/30">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <div>
                        <label className="text-sm font-bold text-gray-900 dark:text-white">{t('organization.form.status_active', 'Active Status')}</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('organization.form.status_active_hint', 'Active organizations can be accessed by their users.')}</p>
                      </div>
                      <div className="relative shrink-0 flex items-center">
                        <input
                          type="checkbox"
                          id="org-is-active"
                          {...register('is_active')}
                          className="peer sr-only"
                          aria-describedby="org-is-active-desc"
                        />
                        <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 peer-focus:ring-offset-2 dark:bg-gray-700 dark:peer-focus:ring-offset-gray-900" />
                        <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                      </div>
                    </label>
                  </div>

                  {isEditing && (
                    <Field
                      label="Organization Owner"
                      hint="Primary administrator and billing contact for this organization."
                      error={errors.owner_id?.message}
                    >
                      <Controller
                        name="owner_id"
                        control={control}
                        render={({ field }) => {
                          const options = (orgUsers?.results || (Array.isArray(orgUsers) ? orgUsers : []))?.map((u: any) => ({
                            value: u.id,
                            label: `${u.first_name} ${u.last_name} (${u.email})`
                          })) || [];
                          
                          return (
                            <SearchableSelect
                              {...field}
                              options={options}
                              placeholder="-- No owner assigned --"
                              isDisabled={isLoadingUsers}
                              isLoading={isLoadingUsers}
                              hasError={!!errors.owner_id}
                            />
                          );
                        }}
                      />
                    </Field>
                  )}

                  {/* Enterprise Audit: Change Reason */}
                  <div className="pt-2">
                    <Field
                      label={t('common.reason', 'Change Reason')}
                      hint={t('common.reason_hint', 'Optional: Reason for this change (stored in audit log)')}
                      error={errors.reason?.message}
                    >
                      <input
                        type="text"
                        {...register('reason')}
                        className={inputCls(!!errors.reason)}
                        placeholder="e.g., Requested by compliance team"
                        autoComplete="off"
                      />
                    </Field>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50 rounded-b-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  {isDirty && !isBusy && (
                    <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isBusy}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {t('organization.form.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    form="org-form"
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                  >
                    {isBusy
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{t('organization.form.saving', 'Saving...')}</>
                      : isEditing
                        ? <><Save className="h-4 w-4" />{t('organization.form.save', 'Save Changes')}</>
                        : <><Zap className="h-4 w-4" />{t('organization.form.create', 'Create Organization')}</>
                    }
                  </button>
                </div>
              </div>
            </div>
        </div>
  );
};

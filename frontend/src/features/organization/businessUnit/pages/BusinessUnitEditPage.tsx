import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Building2, Save, ArrowLeft, Loader2, Info, Eye, Type, FileText,
  Mail, Phone, MapPin, ShieldCheck, Palette
} from 'lucide-react';

import { useBusinessUnit, useUpdateBusinessUnit } from '../hooks/useBusinessUnits';
import { useOrganizationUsers } from '@/features/iam/users/hooks/useUsers';
import { LogoUploadZone } from '@/features/organization/businessDomain/components/LogoUploadZone';
import { PageHeader } from '@/components/ui/PageHeader';
import { BusinessUnitPreviewCard } from '../components/BusinessUnitPreviewCard';
import { SectionCard } from '@/components/platform/SectionCard';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const LOCAL_GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
const LOCAL_PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]{1}$/;
const LOCAL_HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  code: z.string().min(2).max(20).regex(CODE_REGEX, 'Must be 2–20 uppercase letters, numbers, hyphens, or underscores'),
  
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  phone: z.string().optional().or(z.literal('')),
  
  address_line1: z.string().max(255).optional().or(z.literal('')),
  address_line2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().default('IN'),
  pincode: z.string().max(10).optional().or(z.literal('')),
  
  registration_number: z.string().max(100).optional().or(z.literal('')),
  gst_number: z.union([z.string().regex(LOCAL_GST_REGEX, 'Invalid GST format'), z.literal('')]).optional(),
  pan_number: z.union([z.string().regex(LOCAL_PAN_REGEX, 'Invalid PAN format'), z.literal('')]).optional(),
  
  timezone: z.string().optional().or(z.literal('')),
  currency_code: z.string().optional().or(z.literal('')),
  
  logo_url: z.string().optional().nullable(),
  custom_domain: z.string().optional().or(z.literal('')),
  domain_status: z.enum(['pending', 'verified', 'failed']).optional(),
  ssl_status: z.enum(['pending', 'active', 'failed']).optional(),
  branding_mode: z.enum(['platform', 'co_brand', 'white_label']).default('platform'),
  
  manager_id: z.string().uuid('Invalid UUID format').optional().or(z.literal('')),
  
  is_main_branch: z.boolean().default(false),
  is_active: z.boolean().default(true),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;


export const BusinessUnitEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: businessUnit, isLoading, isError } = useBusinessUnit(id as string);
  const { mutateAsync: updateBu, isPending: isUpdating } = useUpdateBusinessUnit();
  const { data: orgUsers, isLoading: isLoadingUsers } = useOrganizationUsers(businessUnit?.organization_id);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const backUrl = '/platform/business-units';

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting }, watch, setValue, reset, control } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', code: '',
      email: '', phone: '',
      address_line1: '', address_line2: '', city: '', state: '', country: 'IN', pincode: '',
      registration_number: '', gst_number: '', pan_number: '',
      timezone: '', currency_code: '', custom_domain: '',
      branding_mode: 'platform', manager_id: '', is_main_branch: false, is_active: true, reason: ''
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (businessUnit) {
      reset({
        name: businessUnit.name, code: businessUnit.code,
        email: businessUnit.email || '', phone: businessUnit.phone || '',
        address_line1: businessUnit.address_line1 || '', address_line2: businessUnit.address_line2 || '',
        city: businessUnit.city || '', state: businessUnit.state || '', country: businessUnit.country || 'IN', pincode: businessUnit.pincode || '',
        registration_number: businessUnit.registration_number || '', gst_number: businessUnit.gst_number || '', pan_number: businessUnit.pan_number || '',
        timezone: businessUnit.timezone || '', currency_code: businessUnit.currency_code || '',
        custom_domain: businessUnit.custom_domain || '',
        domain_status: (businessUnit.domain_status as any) || 'pending',
        ssl_status: (businessUnit.ssl_status as any) || 'pending',
        branding_mode: (businessUnit.branding_mode as any) || 'platform',
        manager_id: businessUnit.manager_id || '',
        is_main_branch: businessUnit.is_main_branch, is_active: businessUnit.is_active,
        logo_url: businessUnit.logo_url || null,
        reason: ''
      });
    }
  }, [businessUnit, reset]);

  const nameWatch = watch('name');
  const codeWatch = watch('code');
  const logoUrlWatch = watch('logo_url');
  const isActiveWatch = watch('is_active');
  const isMainBranchWatch = watch('is_main_branch');
  const cityWatch = watch('city');
  const countryWatch = watch('country');
  const brandingModeWatch = watch('branding_mode');

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.key === 'Escape') {
        if (isDirty) setShowExitPrompt(true);
        else navigate(backUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, navigate, handleSubmit]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      if (logoFile) setIsUploadingLogo(true);
      
      const payload = { ...data } as any;
      if (payload.branding_mode !== 'white_label') payload.custom_domain = '';
      if (payload.branding_mode === 'platform') {
        payload.logo_url = null;
      }
      
      await updateBu({ id, payload });
      navigate(backUrl);
    } catch (err: any) {
      // errors handled by mutation
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const isBusy = isSubmitting || isUpdating || isUploadingLogo;

  const FieldError = ({ name }: { name: keyof FormValues }) => {
    const err = errors[name];
    if (!err) return null;
    return <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-500"><Info className="h-3 w-3" />{err.message as string}</p>;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (isError || !businessUnit) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
        <p className="text-lg font-bold text-gray-900 dark:text-white">Business Unit Not Found</p>
        <button onClick={() => navigate(backUrl)} className="text-sm font-semibold text-violet-600 hover:underline">Return to List</button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up { animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Discard changes?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowExitPrompt(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Keep editing
              </button>
              <button onClick={() => navigate(backUrl)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl p-4 lg:p-8 animate-slide-up">
        <div className="mb-6 lg:mb-8">
          <PageHeader
            title="Edit Business Unit"
            icon={Building2}
            breadcrumbs={[
              { label: 'Platform' },
              { label: 'Business Units', href: backUrl },
              { label: businessUnit.name },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              
              {/* Basic Info */}
              <SectionCard title="Basic Information" icon={Info} iconColor="text-blue-600">

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Business Unit Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Type className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        {...register('name')}
                        autoComplete="off"
                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white transition-all"
                        placeholder="e.g. Main Branch"
                      />
                    </div>
                    <FieldError name="name" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300">
                      <span>Unique Code <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      {...register('code')}
                      autoComplete="off"
                      onChange={(e) => {
                        // H-01 FIX: Normalize code value to uppercase so backend regex matches.
                        const upper = e.target.value.toUpperCase();
                        setValue('code', upper, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 font-mono text-sm uppercase text-gray-900 dark:text-white transition-all"
                      placeholder="e.g. BU-MAIN"
                    />
                    <FieldError name="code" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Business Unit Manager <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Controller
                        name="manager_id"
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
                              placeholder="-- Select Manager --"
                              isDisabled={isLoadingUsers}
                              isLoading={isLoadingUsers}
                              hasError={!!errors.manager_id}
                            />
                          );
                        }}
                      />
                    </div>
                    <FieldError name="manager_id" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Contact & Locale" icon={Mail} iconColor="text-teal-600">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input {...register('email')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white" />
                    </div>
                    <FieldError name="email" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input {...register('phone')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm dark:text-white" />
                    </div>
                    <FieldError name="phone" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Timezone</label>
                    <select {...register('timezone')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm dark:text-white">
                      <option value="">-- Org Default --</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Currency</label>
                    <select {...register('currency_code')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm dark:text-white">
                      <option value="">-- Org Default --</option>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Address" icon={MapPin} iconColor="text-orange-600">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Address Line 1</label><input {...register('address_line1')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm dark:text-white" /></div>
                  <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Address Line 2</label><input {...register('address_line2')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-4 text-sm dark:text-white" /></div>
                  <div><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">City</label><input {...register('city')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent" /></div>
                  <div><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">State</label><input {...register('state')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent" /></div>
                  <div><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Country</label><input {...register('country')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent" /></div>
                  <div><label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Pincode</label><input {...register('pincode')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent" /></div>
                </div>
              </SectionCard>

              <SectionCard title="Legal & Compliance" icon={ShieldCheck} iconColor="text-indigo-600">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Registration Number</label>
                    <input {...register('registration_number')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 py-2.5 px-4 text-sm dark:text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">GST Number</label>
                    <input {...register('gst_number')} className="block w-full uppercase font-mono rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 py-2.5 px-4 text-sm dark:text-white bg-transparent" />
                    <FieldError name="gst_number" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">PAN Number</label>
                    <input {...register('pan_number')} className="block w-full uppercase font-mono rounded-xl border border-gray-200 dark:border-gray-700 focus:border-violet-500 py-2.5 px-4 text-sm dark:text-white bg-transparent" />
                    <FieldError name="pan_number" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Branding" icon={Palette} iconColor="text-pink-600">
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Branding Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['platform', 'co_brand', 'white_label'].map((mode) => (
                        <label key={mode} className={`flex cursor-pointer items-center justify-center rounded-xl border py-3 px-3 text-sm font-bold transition-all ${brandingModeWatch === mode ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/20 dark:text-violet-300' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'}`}>
                          <input type="radio" {...register('branding_mode')} value={mode} className="sr-only" />
                          {mode === 'platform' ? 'Platform' : mode === 'co_brand' ? 'Co-Brand' : 'White Label'}
                        </label>
                      ))}
                    </div>
                  </div>
                  {brandingModeWatch !== 'platform' && (
                    <div className="grid gap-5 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Custom Logo</label>
                        <LogoUploadZone currentLogoUrl={logoUrlWatch || null} pendingFile={logoFile} onFileSelected={setLogoFile} onUploaded={(url: string) => setValue('logo_url', url, { shouldDirty: true })} isUploading={isUploadingLogo} />
                      </div>
                    </div>
                  )}
                  {brandingModeWatch === 'white_label' && (
                    <div className="grid gap-5 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-300 mt-5">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Custom Domain</label>
                        <input {...register('custom_domain')} placeholder="branch.acme.com" className="block w-full font-mono rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent" />
                        <FieldError name="custom_domain" />
                      </div>
                      {watch('custom_domain') && (
                        <>
                          <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Domain Status</label>
                            <select {...register('domain_status')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent">
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">SSL Status</label>
                            <select {...register('ssl_status')} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 px-4 text-sm dark:text-white bg-transparent">
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Toggles & Settings" icon={Eye} iconColor="text-violet-500">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div>
                      <label htmlFor="is_active_edit" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Active Status</label>
                      <p className="text-xs text-gray-400 mt-0.5">Whether this unit is active in the system.</p>
                    </div>
                    <div className="relative ml-4 shrink-0">
                      <input type="checkbox" id="is_active_edit" checked={isActiveWatch} onChange={e => setValue('is_active', e.target.checked, { shouldDirty: true })} className="peer sr-only" />
                      <label htmlFor="is_active_edit" className={`relative flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors duration-200 peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 ${isActiveWatch ? '' : 'bg-gray-200 dark:bg-gray-700'}`} style={{ width: 52, height: 28 }}>
                        <span className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 left-1 ${isActiveWatch ? 'translate-x-6' : 'translate-x-0'}`} />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <label htmlFor="is_main_branch_edit" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Main Branch</label>
                      <p className="text-xs text-gray-400 mt-0.5">Only one main branch is allowed per organization.</p>
                    </div>
                    <div className="relative ml-4 shrink-0">
                      <input type="checkbox" id="is_main_branch_edit" checked={isMainBranchWatch} onChange={e => setValue('is_main_branch', e.target.checked, { shouldDirty: true })} className="peer sr-only" />
                      <label htmlFor="is_main_branch_edit" className={`relative flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors duration-200 peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 ${isMainBranchWatch ? '' : 'bg-gray-200 dark:bg-gray-700'}`} style={{ width: 52, height: 28 }}>
                        <span className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 left-1 ${isMainBranchWatch ? 'translate-x-6' : 'translate-x-0'}`} />
                      </label>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Update Reason" icon={FileText} iconColor="text-gray-400" description="Optional — recorded for audit purposes">
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <textarea
                    {...register('reason')}
                    rows={2}
                    placeholder="e.g. Updating address details..."
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all resize-none"
                  />
                </div>
              </SectionCard>
            </div>

            {/* ── Right: Live preview + save panel ──────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm sticky top-24">
                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Live Preview
                  </h3>
                </div>
                <div className="p-4">
                  <BusinessUnitPreviewCard
                    name={nameWatch}
                    code={codeWatch}
                    logoUrl={logoUrlWatch}
                    isActive={isActiveWatch}
                    isMainBranch={isMainBranchWatch}
                    city={cityWatch}
                    country={countryWatch}
                    pendingFile={logoFile}
                  />
                </div>
                
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
                  <button type="submit" disabled={isBusy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Changes</>}
                  </button>
                  <button type="button" onClick={() => navigate(backUrl)} className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    <ArrowLeft className="h-4 w-4" /> Cancel
                  </button>
                  {isDirty && <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 font-medium">You have unsaved changes</p>}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default BusinessUnitEditPage;

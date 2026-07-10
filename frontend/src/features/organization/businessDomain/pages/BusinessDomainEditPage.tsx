// src/features/organization/businessDomain/pages/BusinessDomainEditPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE FULL PAGE — Business Domain Edit
//
// Route: /platform/business-domains/:id/edit
// Back:  /platform/business-domains/:id  (view page)
// Save:  navigates back to detail page on success
//
// Features:
//  ✅ Full-page form (not modal) — proper URL, bookmarkable, browser back works
//  ✅ Split-panel layout: left = form fields, right = live preview card
//  ✅ Same Zod schema as FormModal for consistency
//  ✅ Auto-generates BDOM-{CODE} from name (stops on manual edit)
//  ✅ Logo upload zone (two-step: update → upload logo)
//  ✅ Dirty-state guard: "Unsaved changes" indicator + block navigation prompt
//  ✅ Keyboard: Escape → back (with dirty check), Ctrl+S / Cmd+S → save
//  ✅ Breadcrumb navigation
//  ✅ Archive-protected warning if domain has assigned orgs
//  ✅ Success → navigates to detail page with toast
//  ✅ Smooth animated entry
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft, ChevronRight, Globe2, Globe, Code, FileText,
  Save, Loader2, AlertTriangle, RefreshCcw, ShieldAlert,
  ImagePlus, X, Upload, Check, Building2, GitBranch, Users,
  Eye, CheckCircle2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useBusinessDomain } from '../api/useBusinessDomains';
import { useBusinessDomainMutations } from '../api/useBusinessDomainMutations';
import { businessDomainSchema, type BusinessDomainFormValues } from '../schemas/businessDomainSchema';
import type { BusinessDomain } from '../types/businessDomainTypes';
import { LogoUploadZone } from '../components/LogoUploadZone';
import { SectionCard } from '@/components/platform/SectionCard';
import { PageSkeleton } from '@/components/platform/PageSkeleton';



// ─── Gradient palette ─────────────────────────────────────────────────────────
const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];
function domainGradient(name: string) {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

// ─── Code generator (same algorithm as FormModal) ─────────────────────────────
function generateDomainCode(name: string): string {
  const words = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  if (!words.length) return '';
  let suffix: string;
  if (words.length === 1) {
    const w = words[0] as string;
    suffix = w.length <= 5 ? w : (w[0] + w.slice(1).replace(/[AEIOU]/g, '')).slice(0, 5);
  } else if (words.length === 2) {
    suffix = ((words[0] as string).slice(0, 3) + (words[1] as string).slice(0, 3)).slice(0, 6);
  } else {
    suffix = words.map(w => w[0]).join('').slice(0, 5);
  }
  return `BDOM-${suffix}`;
}
// ─── Live Preview Card ─────────────────────────────────────────────────────────
function PreviewCard({ name, code, description, logoUrl, isActive, pendingFile }: {
  name: string; code: string; description: string;
  logoUrl?: string | null; isActive: boolean; pendingFile: File | null;
}) {
  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : logoUrl ?? null;
  const grad = name ? domainGradient(name) : 'from-gray-400 to-gray-500';
  const displayName = name || 'Domain Name';
  const displayCode = code || 'BDOM-XXX';

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${grad} p-5 shadow-xl`}>
      {/* Mesh */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {previewUrl ? (
            <img src={previewUrl} alt="logo" className="h-14 w-14 rounded-xl object-contain border-2 border-white/30 bg-white/10 shadow-md" />
          ) : (
            <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center border-2 border-white/20 shadow-md text-white text-xl font-black`}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white leading-tight truncate">{displayName}</h3>
            <code className="mt-1 inline-flex rounded-lg bg-white/15 px-2 py-0.5 text-xs font-mono font-bold text-white/90">
              {displayCode}
            </code>
          </div>
        </div>
        {description && (
          <p className="text-sm text-white/75 leading-relaxed line-clamp-3">{description}</p>
        )}
        <div className="flex items-center gap-2 pt-2 border-t border-white/20">
          {isActive
            ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/25 px-3 py-1 text-xs font-bold text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /> Active</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 px-3 py-1 text-xs font-bold text-amber-100"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Inactive</span>
          }
          <span className="text-xs text-white/50">Preview</span>
        </div>
      </div>
    </div>
  );
}

// ─── Input style helper ────────────────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return `w-full rounded-xl border ${
    hasError
      ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 bg-gray-50/50 text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-800/50'
  } px-4 py-2.5 text-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-offset-0`;
}

// ─── Page skeleton ─────────────────────────────────────────────────────────────
function EditSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-2 h-5">
        {[24, 32, 24, 40].map((w, i) => <div key={i} className={`h-3 w-${w} rounded bg-gray-200 dark:bg-gray-800`} />)}
      </div>
      <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-52 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Edit Page ────────────────────────────────────────────────────────────
export const BusinessDomainEditPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: domain, isLoading, isError, refetch } = useBusinessDomain(id);
  const { updateDomain, uploadLogo, isUpdating, isUploadingLogo } = useBusinessDomainMutations();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const codeManuallyEdited = useRef(false);

  const backUrl   = `/platform/business-domains/${id}`;
  const domainListUrl = '/platform/business-domains';

  const isBusy = isUpdating || isUploadingLogo;

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue,
  } = useForm<BusinessDomainFormValues>({
    resolver: zodResolver(businessDomainSchema),
    defaultValues: { name: '', code: '', description: '', logo_url: '', is_active: true },
  });

  // Reset form when domain loads
  useEffect(() => {
    if (domain) {
      codeManuallyEdited.current = true; // don't auto-gen when editing
      reset({
        name:        domain.name,
        code:        domain.code,
        description: domain.description ?? '',
        logo_url:    domain.logo_url ?? '',
        is_active:   domain.is_active,
      });
    }
  }, [domain, reset]);

  const nameWatch     = watch('name');
  const codeWatch     = watch('code');
  const descWatch     = watch('description');
  const isActiveWatch = watch('is_active');
  const logoUrlWatch  = watch('logo_url');

  // Auto-gen code only for new domains (not needed in edit, but kept consistent)
  useEffect(() => {
    if (!codeManuallyEdited.current) {
      setValue('code', generateDomainCode(nameWatch || ''), { shouldValidate: false, shouldDirty: false });
    }
  }, [nameWatch, setValue]);

  // ── Block native navigation if dirty ──────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // standard for modern browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S → submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('edit-domain-form')?.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        );
        return;
      }
      // Escape → back (only if no dirty state)
      if (e.key === 'Escape' && !isDirty) {
        e.preventDefault();
        navigate(backUrl);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, navigate, backUrl]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: BusinessDomainFormValues) => {
    if (!domain) return;
    try {
      const payload = { ...values, logo_url: values.logo_url || null };
      await updateDomain({ id: domain.id, payload });

      if (logoFile) {
        try {
          await uploadLogo({ id: domain.id, file: logoFile });
        } catch {
          toast.error('Domain saved, but logo upload failed.');
        }
      }

      toast.success(`"${values.name}" updated successfully!`, { icon: '✅' });
      navigate(backUrl, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        Object.values(err?.response?.data ?? {})[0] ||
        'Failed to save changes.';
      toast.error(typeof msg === 'string' ? msg : 'Validation error. Please check your inputs.');
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) return <div className="max-w-5xl mx-auto px-6 py-6"><PageSkeleton variant="detail" /></div>;

  if (isError || !domain) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <AlertTriangle className="h-16 w-16 text-rose-400 mx-auto mb-5" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Domain Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Could not load domain data. It may have been deleted.
      </p>
      <Link to={domainListUrl}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Domains
      </Link>
    </div>
  );

  if (domain.is_deleted) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-900/20 mx-auto mb-5">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Archived Domain</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Archived domains cannot be edited. Restore it first.
      </p>
      <Link to={backUrl}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Domain
      </Link>
    </div>
  );

  const orgsCount = domain.organizations_count ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 animate-fadeInUp">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm py-5 text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link to="/platform" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">Platform</Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <Link to={domainListUrl} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">Business Domains</Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <Link to={backUrl} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium truncate max-w-[140px]">{domain.name}</Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white">Edit</span>
        </nav>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 p-5 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-100 dark:border-violet-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={backUrl} aria-label="Back to domain detail"
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-600 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">
                Edit — <span className="text-violet-600 dark:text-violet-400">{domain.name}</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <code className="font-mono bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{domain.code}</code>
                {isDirty && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden lg:inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 shadow-sm gap-1">
              ⌘S <span className="font-sans">Save</span>
            </kbd>
          </div>
        </div>

        {/* Archive-protection warning */}
        {orgsCount > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3.5">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {orgsCount} Organization{orgsCount !== 1 ? 's' : ''} Assigned
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Renaming or changing the code will update the domain globally. Deactivation is blocked while organizations are assigned.
              </p>
            </div>
          </div>
        )}

        {/* ── Main split-panel layout ──────────────────────────────────────── */}
        <form id="edit-domain-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Left: Form fields ──────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Name */}
              <SectionCard title="Domain Name" icon={Globe} iconColor="text-violet-500" noPadding={false}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Domain Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register('name')}
                    autoFocus
                    placeholder="e.g., Retail, Pharmacy, HRMS"
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`${inputCls(!!errors.name)} pl-10`}
                  />
                </div>
                {errors.name && <p id="name-error" role="alert" className="mt-1.5 text-xs text-rose-500 font-medium">{errors.name.message}</p>}
              </SectionCard>

              {/* Code */}
              <SectionCard title="Domain Code" icon={Code} iconColor="text-indigo-500" noPadding={false}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Domain Code <span className="text-rose-500">*</span>
                  <span className="ml-2 text-[11px] font-normal text-gray-400">Format: BDOM-XXXX</span>
                </label>
                <div className="relative">
                  <Code className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register('code')}
                    onChange={e => {
                      codeManuallyEdited.current = true;
                      e.target.value = e.target.value.toUpperCase();
                      register('code').onChange(e);
                    }}
                    placeholder="BDOM-RTL"
                    className={`${inputCls(!!errors.code)} pl-10 font-mono uppercase`}
                    aria-describedby={errors.code ? 'code-error' : undefined}
                  />
                </div>
                {errors.code && <p id="code-error" role="alert" className="mt-1.5 text-xs text-rose-500 font-medium">{errors.code.message}</p>}
              </SectionCard>

              {/* Description */}
              <SectionCard title="Description" icon={FileText} iconColor="text-gray-400" noPadding={false}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Optional: describe this business domain's purpose and scope…"
                    className={`${inputCls(!!errors.description)} pl-10 resize-none`}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className={`text-[11px] font-medium tabular-nums ${(descWatch?.length ?? 0) > 480 ? 'text-rose-500' : 'text-gray-400'}`}>
                    {descWatch?.length ?? 0} / 500
                  </span>
                </div>
              </SectionCard>

              {/* Logo upload */}
              <SectionCard title="Domain Logo" icon={ImagePlus} iconColor="text-pink-500" noPadding={false}>
                <LogoUploadZone
                  currentLogoUrl={logoUrlWatch ?? null}
                  pendingFile={logoFile}
                  onFileSelected={setLogoFile}
                  onUploaded={url => setValue('logo_url', url, { shouldDirty: true })}
                  isUploading={isUploadingLogo}
                />
              </SectionCard>

              {/* Active toggle */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="is_active_edit" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Active Status
                    </label>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {orgsCount > 0
                        ? `Cannot deactivate — ${orgsCount} organization${orgsCount !== 1 ? 's' : ''} assigned`
                        : 'Whether this domain is available for Organization assignments'}
                    </p>
                  </div>
                  <div className="relative ml-4 shrink-0">
                    <input
                      type="checkbox"
                      id="is_active_edit"
                      checked={isActiveWatch}
                      disabled={!isActiveWatch && orgsCount > 0}
                      onChange={e => setValue('is_active', e.target.checked, { shouldDirty: true })}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="is_active_edit"
                      className={`relative flex h-7 w-13 cursor-pointer items-center rounded-full transition-colors duration-200 peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${isActiveWatch ? '' : 'bg-gray-200 dark:bg-gray-700'}`}
                      style={{ width: 52, height: 28 }}
                    >
                      <span className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 left-1 ${isActiveWatch ? 'translate-x-6' : 'translate-x-0'}`} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Edit Reason (Audit) */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-5 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Update <span className="text-rose-500">*</span>
                  <span className="ml-2 text-[11px] font-normal text-gray-400">Required for Audit Trail</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <textarea
                    {...register('reason')}
                    rows={2}
                    required
                    placeholder="e.g. Correcting a typo, updating logo..."
                    className={`${inputCls(!!errors.reason)} pl-10 resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* ── Right: Live preview + save panel ──────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Live preview card */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/80 dark:bg-gray-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Live Preview
                  </h3>
                </div>
                <div className="p-4">
                  <PreviewCard
                    name={nameWatch}
                    code={codeWatch}
                    description={descWatch ?? ''}
                    logoUrl={logoUrlWatch}
                    isActive={isActiveWatch}
                    pendingFile={logoFile}
                  />
                </div>
              </div>

              {/* Stats summary */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Current Stats</h3>
                {[
                  { icon: Building2, label: 'Organizations', value: orgsCount, color: 'text-blue-500' },
                  { icon: GitBranch, label: 'Business Units', value: domain.business_units_count ?? 0, color: 'text-violet-500' },
                  { icon: Users, label: 'Active Users', value: domain.active_users_count ?? 0, color: 'text-emerald-500' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className={`flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      {label}
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Save / Cancel */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  {isBusy
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><Save className="h-4 w-4" /> Save Changes</>
                  }
                </button>
                <Link to={backUrl}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Cancel
                </Link>
                {isDirty && (
                  <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    You have unsaved changes
                  </p>
                )}
              </div>

              {/* Keyboard hints */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Keyboard</p>
                {[
                  { key: '⌘S', label: 'Save changes' },
                  { key: 'Esc', label: 'Back (if no changes)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                    <kbd className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-500 shadow-sm">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
    </div>
  );
};

export default BusinessDomainEditPage;

// src/pages/organization/OrganizationSettingsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENTERPRISE SETTINGS PAGE — Premium redesign (matches Detail + List pages)
//  ✅ Gradient hero header with breadcrumb (org name → Settings)
//  ✅ Section cards with gradient icon headers + subtitle
//  ✅ Premium toggle switches with gradient glow (not plain bg-primary)
//  ✅ Logo upload + color picker + 12 preset swatches + live preview
//  ✅ Domain section: default platform domain + custom domain edit/delete
//  ✅ Security section: MFA, API, Audit log toggles + session timeout + max users
//  ✅ Notifications section: login + export alerts
//  ✅ Sticky save bar: gradient button + animated progress bar + discard
//  ✅ Enterprise skeleton matching real layout
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Settings, Shield, Bell, Palette, Save, Loader2,
  AlertTriangle, Users, Clock, CheckCircle2,
  Building2, Info, Globe2, Edit2, Trash2, X, ChevronRight,
  Lock, Wifi, Activity, Zap, Fingerprint, RefreshCcw,
} from 'lucide-react';

import {
  useOrganization, useUpdateOrganizationSettings, useUploadOrganizationLogo,
} from '@/features/organization/hooks/useOrganizations';
import { LogoUploadZone } from '@/features/organization/components/LogoUploadZone';
import type { OrganizationSettingsUpdatePayload } from '@/features/organization/types/organizationTypes';
import { getOrgInitials, getAvatarColor } from '@/features/organization/utils/organizationHelpers';

// ─── Schema ────────────────────────────────────────────────────────────────────
const FQDN_REGEX = /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)\.(?!-)[a-zA-Z0-9-]{2,63}(?<!-)(\.[a-zA-Z0-9-]{2,63})*$/;

const schema = z.object({

  custom_domain:           z.string().regex(FQDN_REGEX, 'Must be a valid FQDN (e.g. app.acme.com)').nullable().optional().or(z.literal('')),
  require_mfa:             z.boolean().default(false),
  session_timeout_minutes: z.number().int().min(5, 'Min 5 min').max(1440, 'Max 24 hrs').default(60),
  enable_audit_log:        z.boolean().default(true),
  enable_api_access:       z.boolean().default(false),
  max_users:               z.number().int().positive('Must be positive').nullable().optional(),
  notify_on_login:         z.boolean().default(false),
  notify_on_data_export:   z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

// ─── Preset Colors ─────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  '#6366F1', '#7C3AED', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#8B5CF6', '#06B6D4', '#64748B',
];

// ─── Input class ────────────────────────────────────────────────────────────────
const inputCls = [
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60',
  'px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400',
  'shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

// ─── Premium Toggle Field ──────────────────────────────────────────────────────
function ToggleField({
  icon: Icon, label, description, value, onChange, color = 'violet',
}: {
  icon: React.ElementType; label: string; description?: string;
  value: boolean; onChange: (v: boolean) => void; color?: 'violet' | 'emerald' | 'blue' | 'amber';
}) {
  const gradients = {
    violet:  'from-violet-500 to-purple-500 shadow-violet-500/25',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
    blue:    'from-blue-500 to-indigo-500 shadow-blue-500/25',
    amber:   'from-amber-500 to-orange-500 shadow-amber-500/25',
  }[color];

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-all hover:border-violet-200 dark:hover:border-violet-800/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${value ? `bg-gradient-to-br ${gradients} shadow-md` : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
          <Icon className={`h-4 w-4 ${value ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
          {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {value ? 'On' : 'Off'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
            value
              ? `bg-gradient-to-r ${gradients} shadow-md`
              : 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
          }`}
        >
          <span
            className="absolute h-[18px] w-[18px] rounded-full bg-white shadow-md transition-all duration-300"
            style={{ left: value ? 20 : 2 }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({
  title, subtitle, iconBg, icon: Icon, children,
}: {
  title: string; subtitle?: string; iconBg: string; icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 px-6 py-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Field Label ────────────────────────────────────────────────────────────────
function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl" role="status" aria-label="Loading settings">
      <div className="h-4 w-64 rounded-full bg-gray-200 dark:bg-gray-800" />
      <div className="h-28 w-full rounded-2xl bg-gray-100 dark:bg-gray-800" />
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="h-16 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50" />
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, j) => <div key={j} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export const OrganizationSettingsPage: React.FC = () => {
  const { id }                          = useParams<{ id: string }>();
  const { data: org, isLoading }        = useOrganization(id ?? '');
  const settings                        = org?.settings;
  const updateMutation                  = useUpdateOrganizationSettings();
  const uploadMutationLogo              = useUploadOrganizationLogo();

  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const [isEditingDomain, setIsEditingDomain] = useState(false);

  const {
    register, handleSubmit, reset, control, watch, setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {

      custom_domain:           '',
      require_mfa:             false,
      session_timeout_minutes: 60,
      enable_audit_log:        true,
      enable_api_access:       false,
      max_users:               null,
      notify_on_login:         false,
      notify_on_data_export:   true,
    },
  });



  useEffect(() => {
    if (settings) {
      reset({

        custom_domain:           settings.custom_domain || '',
        require_mfa:             settings.require_mfa,
        session_timeout_minutes: settings.session_timeout_minutes,
        enable_audit_log:        settings.enable_audit_log,
        enable_api_access:       settings.enable_api_access,
        max_users:               settings.max_users,
        notify_on_login:         settings.notify_on_login,
        notify_on_data_export:   settings.notify_on_data_export,
      });

    }
  }, [settings, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;
    try {
      const payload: OrganizationSettingsUpdatePayload = { ...data, max_users: data.max_users ?? null };
      await updateMutation.mutateAsync({ id, payload: payload as any });
      if (logoFile) {
        try { await uploadMutationLogo.mutateAsync({ id, file: logoFile }); }
        catch { toast.error('Settings saved, but logo upload failed.'); }
      }
      setIsEditingDomain(false);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save settings.');
    }
  };

  if (isLoading) return <SettingsSkeleton />;

  if (!settings) return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20">
        <AlertTriangle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
      </div>
      <div>
        <p className="text-base font-bold text-gray-900 dark:text-white">Settings not found</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Settings are typically auto-provisioned when an organization is created.</p>
      </div>
      <Link
        to={`/platform/organizations/${id}`}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Organization
      </Link>
    </div>
  );

  const { bg } = getAvatarColor(org?.name ?? '');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link to="/platform/organizations" className="inline-flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          <Building2 className="h-3.5 w-3.5" /> Organizations
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
        <Link to={`/platform/organizations/${id}`} className="font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate max-w-[160px]">
          {org?.name ?? 'Organization'}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
        <span className="font-semibold text-gray-900 dark:text-white">Settings</span>
      </nav>

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-center gap-5 p-6 md:p-8">
          {/* Org avatar */}
          {org?.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-16 w-16 rounded-2xl border-2 border-white dark:border-gray-700 object-contain bg-white dark:bg-gray-800 shadow-lg shrink-0" />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg border-2 border-white/20"
              style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}aa 100%)`, boxShadow: `0 8px 24px ${bg}44` }}
            >
              {getOrgInitials(org?.name ?? '')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Organization Settings
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure branding, security, and notifications
              {org?.name ? <> for <span className="font-semibold text-gray-700 dark:text-gray-200">{org.name}</span></> : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Branding ─────────────────────────────────────────────────────── */}
        <SectionCard title="Branding" subtitle="Customize colors and visual identity" iconBg="from-pink-500 to-rose-500" icon={Palette}>
          <div className="grid gap-8 sm:grid-cols-2">

            {/* Color picker column */}
            <div className="space-y-6">
              <div>
                <FieldLabel label="Organization Logo" hint="Custom logo displayed across the platform" />
                <LogoUploadZone
                  orgId={id}
                  currentLogoUrl={org?.logo_url ?? null}
                  onUploaded={() => {}}
                  onFileSelected={setLogoFile}
                />
              </div>
            </div>



            {/* Live preview column */}
            <div className="space-y-4">
              <FieldLabel label="Live Preview" hint="Real-time preview of your brand color" />
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Mock nav bar */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-600">
                  <Building2 className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">{org?.name ?? 'My Organization'}</span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-white/50" />
                </div>
                <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-5">
                  <div className="inline-flex h-9 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2">
                    <CheckCircle2 className="h-4 w-4" /> Primary Button
                  </div>
                  <div className="text-sm font-semibold text-violet-600">Themed link text →</div>
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm bg-violet-600">
                    Active Badge
                  </div>
                  <div className="rounded-xl border p-3 text-xs text-gray-500 dark:text-gray-400 border-violet-600/40">
                    <span className="font-semibold text-violet-600">Note:</span> Accent border color preview
                  </div>
                </div>
              </div>
            </div>

            {/* Domain section — full width */}
            <div className="space-y-5 sm:col-span-2 pt-6 border-t border-gray-100 dark:border-gray-800">
              {/* Info note */}
              <div className="flex gap-3 rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-900/15 p-4 text-sm mb-6">
                <Info className="h-5 w-5 shrink-0 mt-0.5 text-violet-600 dark:text-violet-400" />
                <div className="text-violet-700 dark:text-violet-300 space-y-1">
                  <h4 className="font-bold">Understanding Domains</h4>
                  <p className="text-xs opacity-90">
                    <strong>Custom Domain:</strong> Your own dedicated address (e.g. <code className="bg-violet-100 dark:bg-violet-900/40 px-1 py-0.5 rounded font-mono">portal.acmecorp.com</code>). Requires DNS configuration and verification.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-1">
                {/* Custom domain */}
                <div className="col-span-1">
                  <FieldLabel label="Custom Domain" hint="Your dedicated white-label domain" />
                  {settings?.custom_domain && !isEditingDomain ? (
                    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-all hover:border-violet-200 dark:hover:border-violet-800/50">
                      <div className="flex items-center gap-3 pr-16">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                          <Globe2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">{settings.custom_domain}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {settings.domain_status === 'verified'
                              ? <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                              : settings.domain_status === 'failed'
                                ? <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Failed</span>
                                : <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                            }
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            {settings.ssl_status === 'active'
                              ? <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">SSL Active</span>
                              : <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">SSL Pending</span>
                            }
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setIsEditingDomain(true)} className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors" title="Edit Domain">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => { setValue('custom_domain', '', { shouldDirty: true, shouldValidate: true }); setIsEditingDomain(true); }} className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="Remove Domain">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            {...register('custom_domain', { setValueAs: v => (!v ? null : String(v).toLowerCase()) })}
                            className={`${inputCls} pl-10`}
                            placeholder="e.g. portal.acmecorp.com"
                            autoFocus={isEditingDomain && !!settings?.custom_domain}
                          />
                        </div>
                        {isEditingDomain && settings?.custom_domain && (
                          <button
                            type="button"
                            onClick={() => { setValue('custom_domain', settings.custom_domain, { shouldDirty: true }); setIsEditingDomain(false); }}
                            className="shrink-0 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            title="Cancel"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      {errors.custom_domain && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                          <AlertTriangle className="h-3.5 w-3.5" /> {errors.custom_domain.message}
                        </p>
                      )}
                      {settings?.custom_domain && isEditingDomain && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" /> Changing the domain will require DNS verification again.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </SectionCard>

        {/* ── Security & Access ─────────────────────────────────────────────── */}
        <SectionCard title="Security & Access" subtitle="Authentication, sessions, and API controls" iconBg="from-violet-500 to-purple-600" icon={Shield}>
          <div className="space-y-3">
            <Controller name="require_mfa" control={control} render={({ field }) => (
              <ToggleField icon={Lock} label="Require Multi-Factor Authentication" description="Enforce MFA for all users in this organization" value={field.value} onChange={field.onChange} color="violet" />
            )} />
            <Controller name="enable_api_access" control={control} render={({ field }) => (
              <ToggleField icon={Wifi} label="Enable API Access" description="Allow this organization to generate and use API keys" value={field.value} onChange={field.onChange} color="blue" />
            )} />
            <Controller name="enable_audit_log" control={control} render={({ field }) => (
              <ToggleField icon={Activity} label="Enable Audit Logging" description="Track all actions performed by users in this organization" value={field.value} onChange={field.onChange} color="emerald" />
            )} />
          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-100 dark:border-gray-800 pt-6 sm:grid-cols-2">
            {/* Session Timeout */}
            <div>
              <FieldLabel label="Session Timeout" hint="Minutes of inactivity before auto-logout (5–1440)" />
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  {...register('session_timeout_minutes', { valueAsNumber: true })}
                  className={`${inputCls} pl-10`}
                  min={5} max={1440}
                  placeholder="60"
                />
              </div>
              {errors.session_timeout_minutes && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.session_timeout_minutes.message}
                </p>
              )}
            </div>

            {/* Max Users */}
            <div>
              <FieldLabel label="Max Users" hint="Leave blank for unlimited seats" />
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  {...register('max_users', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  className={`${inputCls} pl-10`}
                  min={1}
                  placeholder="Unlimited"
                />
              </div>
              {errors.max_users && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.max_users.message}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <SectionCard title="Notification Policies" subtitle="Email alerts and system event notifications" iconBg="from-blue-500 to-cyan-500" icon={Bell}>
          <div className="space-y-3">
            <Controller name="notify_on_login" control={control} render={({ field }) => (
              <ToggleField icon={Fingerprint} label="Login Notifications" description="Alert admins on each new user login in this organization" value={field.value} onChange={field.onChange} color="amber" />
            )} />
            <Controller name="notify_on_data_export" control={control} render={({ field }) => (
              <ToggleField icon={Zap} label="Data Export Alerts" description="Notify admins when bulk data exports are triggered" value={field.value} onChange={field.onChange} color="blue" />
            )} />
          </div>

          <div className="mt-5 flex gap-3 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/15 p-4">
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="text-blue-700 dark:text-blue-300">
              <h4 className="text-sm font-bold">Notification Delivery</h4>
              <p className="mt-0.5 text-xs opacity-90">Notifications are sent to the platform email configured for this organization. Ensure the contact email is up to date.</p>
            </div>
          </div>
        </SectionCard>

      </form>

      {/* ── Sticky Save Bar ──────────────────────────────────────────────────── */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4 transition-all duration-300">
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 shadow-2xl backdrop-blur-md">
            {/* Progress stripe when saving */}
            {updateMutation.isPending && (
              <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Unsaved Changes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Save or discard your changes before leaving.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { if (settings) reset({ ...settings, max_users: settings.max_users }); }}
                  disabled={updateMutation.isPending}
                  className="flex-1 sm:flex-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateMutation.isPending}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {updateMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : <><Save className="h-4 w-4" /> Save Settings</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSettingsPage;

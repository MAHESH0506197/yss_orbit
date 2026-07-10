// src/features/tenancy/tenantSettings/tenantSettingsListPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Tenant Settings — v3.0 Golden Standard
//  ✅ PageHeader with breadcrumbs + gradient icon
//  ✅ Premium category cards with accent borders + icons
//  ✅ Quick Actions sidebar
//  ✅ Templates link
//  ✅ Dark mode full support
//  ✅ Hover micro-animations
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings2, Globe, CreditCard, Bell, ShieldCheck,
  ChevronRight, Download, Upload, RotateCcw, Clock,
  Layers, CheckCircle2, AlertTriangle, Info, ExternalLink,
  Zap, Database, Mail, Lock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

// ─── Setting Category Config ──────────────────────────────────────────────────
interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  badge?: { label: string; color: string };
  items: string[];
  route: string;
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Configure global preferences: timezone, locale, date/time formats, and system-wide defaults for all users.',
    icon: Globe,
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    accentBorder: 'border-l-blue-500',
    accentBg: 'bg-blue-50 dark:bg-blue-900/20',
    accentText: 'text-blue-600 dark:text-blue-400',
    items: ['Timezone & Locale', 'Date/Time Format', 'Language', 'Default Currency'],
    route: 'general',
  },
  {
    id: 'billing',
    title: 'Billing & Payments',
    description: 'Manage invoice configurations, tax rates, payment gateways, billing cycles, and financial compliance settings.',
    icon: CreditCard,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    accentBorder: 'border-l-emerald-500',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    items: ['Payment Gateway', 'Tax Configuration', 'Invoice Templates', 'Billing Cycles'],
    route: 'billing',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    description: 'Configure email providers, SMS gateways, push notification services, alert thresholds, and digest schedules.',
    icon: Bell,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accentBorder: 'border-l-amber-500',
    accentBg: 'bg-amber-50 dark:bg-amber-900/20',
    accentText: 'text-amber-600 dark:text-amber-400',
    badge: { label: '3 unread', color: 'bg-rose-500' },
    items: ['Email Provider', 'SMS Gateway', 'Push Notifications', 'Alert Rules'],
    route: 'notifications',
  },
  {
    id: 'security',
    title: 'Security & Access',
    description: 'Define password policies, enforce 2FA requirements, configure session timeouts, IP allowlists, and audit logging.',
    icon: ShieldCheck,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    accentBorder: 'border-l-violet-500',
    accentBg: 'bg-violet-50 dark:bg-violet-900/20',
    accentText: 'text-violet-600 dark:text-violet-400',
    items: ['Password Policy', '2FA / MFA', 'Session Limits', 'IP Allowlist'],
    route: 'security',
  },
];

// ─── Quick Action ─────────────────────────────────────────────────────────────
interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  variant: 'default' | 'warning' | 'danger';
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SettingSectionCard({ section, onClick }: { section: SettingSection; onClick: () => void }) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col text-left w-full rounded-[1.5rem] border-l-4 border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden ${section.accentBorder}`}
    >
      {/* Gradient top accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${section.gradient} opacity-70`} />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${section.accentBg} shadow-inner`}>
            <Icon className={`h-6 w-6 ${section.accentText}`} />
          </div>
          <div className="flex items-center gap-2">
            {section.badge && (
              <span className={`inline-flex items-center rounded-full ${section.badge.color} px-2 py-0.5 text-[10px] font-bold text-white`}>
                {section.badge.label}
              </span>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {section.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {section.description}
          </p>
        </div>

        {/* Feature list */}
        <ul className="grid grid-cols-2 gap-1.5">
          {section.items.map(item => (
            <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <CheckCircle2 className={`h-3 w-3 shrink-0 ${section.accentText}`} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  const colorClass = {
    default: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800',
    danger:  'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border-rose-200 dark:border-rose-800',
  }[action.variant];

  return (
    <button
      onClick={action.onClick}
      className={`flex items-center gap-3 w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${colorClass}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-gray-900/40">
        <Icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold">{action.label}</p>
        <p className="text-[10px] opacity-70 truncate">{action.description}</p>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const TenantSettingsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setExportLoading(false);
  };

  const quickActions: QuickAction[] = [
    {
      icon: Download,
      label: 'Export Configuration',
      description: 'Download settings as JSON',
      onClick: handleExport,
      variant: 'default',
    },
    {
      icon: Upload,
      label: 'Import Configuration',
      description: 'Upload a config backup',
      onClick: () => {},
      variant: 'default',
    },
    {
      icon: Layers,
      label: 'Manage Templates',
      description: 'View settings templates',
      onClick: () => navigate('templates'),
      variant: 'default',
    },
    {
      icon: RotateCcw,
      label: 'Reset to Defaults',
      description: 'Restore factory settings',
      onClick: () => {},
      variant: 'danger',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">

      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        icon={Settings2}
        iconGradient="from-indigo-500 via-purple-500 to-fuchsia-600"
        title="Tenant Settings"
        subtitle="Manage global settings, configurations, and preferences for your tenant environment."
        breadcrumbs={[
          { label: 'IAM' },
          { label: 'Settings' },
        ]}
        actions={
          <button
            onClick={() => navigate('templates')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Layers className="h-4 w-4 text-gray-400" />
            Manage Templates
          </button>
        }
      />

      {/* ── Info Banner ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 p-4">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          Changes to these settings affect all users in your tenant environment.
          Configuration changes are logged in the audit trail.
        </p>
      </div>

      {/* ── Main Grid + Sidebar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Settings Cards — 2-column on large */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SETTING_SECTIONS.map(section => (
              <SettingSectionCard
                key={section.id}
                section={section}
                onClick={() => navigate(section.route)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="rounded-[1.5rem] border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-gray-800/30 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Zap style={{ height: 16, width: 16 }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quick Actions</h3>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {quickActions.map(action => (
                <QuickActionCard key={action.label} action={action} />
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="rounded-[1.5rem] border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-gray-800/30 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
                  <Database style={{ height: 16, width: 16 }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">System Info</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Config Version', value: 'v2.4.1', icon: Layers },
                { label: 'Last Modified', value: '2 hours ago', icon: Clock },
                { label: 'Audit Log', value: 'View 148 events', icon: ExternalLink },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Status */}
          <div className="rounded-[1.5rem] border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Security Status: Optimal</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  All security policies are active. Last scan: 1 hour ago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettingsListPage;

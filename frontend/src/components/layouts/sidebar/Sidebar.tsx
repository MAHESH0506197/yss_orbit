// yss_orbit\frontend\src\components\layouts\sidebar\Sidebar.tsx
/**
 * YSS Orbit – Sidebar v5.0 "Studio" Premium Design
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  Design philosophy:
 *  ▸ Dark-first, glass-effect surface — premium SaaS feel
 *  ▸ Two clearly separated sections:
 *      CORE        → Platform Admin         (violet #7C3AED)
 *      OPERATIONAL → HR & Payroll + PQM    (emerald #059669 / amber)
 *  ▸ Crystal-clear 3-level visual hierarchy:
 *      L1 Group     — bold colored icon pill + strong label
 *      L2 Sub-group — compact chip row, muted
 *      L3 Leaf      — indented, icon + label, active = glow pill
 *  ▸ Per-section "Expand All / Collapse All" in section label row
 *  ▸ Gradient divider between sections (not just a line)
 *  ▸ Smooth spring-like accordion animations
 *  ▸ Resizable + collapsible
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation }       from 'react-i18next';
import { useSidebarStore }      from '../shell/useSidebarStore';
import { useAuthStore }         from '@/store/authStore';
import { useTenantContext }     from '@/store/context/TenantContext';
import { cn }                   from '@/utils/cn';
import {
  Search, X, ChevronDown, ChevronLeft, ChevronRight,
  LayoutGrid, Users, Activity, Settings, Clock, CreditCard,
  Briefcase, TrendingUp, BarChart2, LayoutList, Shield,
  Server, User, Cpu, Network, Layers,
  ChevronsDownUp,
} from 'lucide-react';
import {
  FcComboChart, FcOrganization, FcDepartment, FcConferenceCall,
  FcPrivacy, FcLink, FcCurrencyExchange, FcGlobe, FcTemplate,
  FcManager, FcClock, FcCalendar, FcMoneyTransfer, FcBriefcase,
  FcRating, FcOk, FcPackage, FcHighPriority, FcSalesPerformance,
  FcTimeline, FcBusinessman, FcBarChart, FcOvertime,
  FcLineChart, FcOnlineSupport, FcSettings, FcDataSheet,
  FcElectricalSensor, FcGenealogy, FcKey, FcList, FcKindle,
  FcInspection, FcInfo, FcGrid,
} from 'react-icons/fc';

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES  (injected once)
───────────────────────────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('yss-sb-v5')) {
  const el = document.createElement('style');
  el.id = 'yss-sb-v5';
  el.textContent = `
    /* Sidebar scroll track — uses CSS variable so it works in both light & dark */
    .sb5-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--border-strong)) transparent; }
    .sb5-scroll::-webkit-scrollbar { width: 3px; }
    .sb5-scroll::-webkit-scrollbar-track { background: transparent; }
    .sb5-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border-strong)); border-radius: 99px; }

    @keyframes sb5SlideDown {
      from { opacity:0; transform: translateY(-4px); }
      to   { opacity:1; transform: translateY(0); }
    }
    @keyframes sb5SlideRight {
      from { opacity:0; transform: translateX(-6px); }
      to   { opacity:1; transform: translateX(0); }
    }
    @keyframes sb5ScalePop {
      0%   { transform: scale(0.88); opacity:0; }
      60%  { transform: scale(1.06); opacity:1; }
      100% { transform: scale(1);    opacity:1; }
    }
    @keyframes sb5BarGrow {
      from { transform: scaleY(0); opacity:0; }
      to   { transform: scaleY(1); opacity:1; }
    }
    @keyframes sb5GlowPulse {
      0%,100% { box-shadow: 0 0 6px 1px var(--sb5-glow,rgba(124,58,237,0.4)); }
      50%     { box-shadow: 0 0 14px 3px var(--sb5-glow,rgba(124,58,237,0.6)); }
    }
    @keyframes sb5DividerShimmer {
      0%   { background-position: -300% center; }
      100% { background-position:  300% center; }
    }
    @keyframes sb5SectionFadeIn {
      from { opacity:0; transform: translateY(3px); }
      to   { opacity:1; transform: translateY(0); }
    }
    @keyframes sb5Shimmer {
      0%   { background-position: -400% center; }
      100% { background-position:  400% center; }
    }
    .sb5-divider-line {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(124,58,237,0.15) 15%,
        rgba(124,58,237,0.55) 35%,
        rgba(5,150,105,0.55)  65%,
        rgba(5,150,105,0.15) 85%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: sb5Shimmer 3s linear infinite;
    }
  `;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface NavLeaf {
  name: string; path: string; icon: React.ReactNode;
  module?: string; feature?: string;
  superAdminOnly?: boolean; permission?: string;
}
interface NavSubGroup { name: string; items: NavLeaf[]; }
interface NavGroup    { name: string; items?: NavLeaf[]; subGroups?: NavSubGroup[]; }

/* ─────────────────────────────────────────────────────────────────────────────
   NAVIGATION DATA
───────────────────────────────────────────────────────────────────────────── */
const NAVIGATION: NavGroup[] = [
  { name: 'Overview', items: [
    { name: 'Platform Dashboard', path: '/platform/dashboard', icon: <FcComboChart size={16}/>, module: 'MODULE_PLATFORM', feature: 'FEATURE_PLATFORM_DASHBOARD', superAdminOnly: true },
  ]},
  { name: 'Organization', items: [
    { name: 'Business Domains', path: '/platform/business-domains', icon: <FcGlobe size={16}/>,        module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_DOMAINS',  superAdminOnly: true },
    { name: 'Organizations',    path: '/platform/organizations',    icon: <FcOrganization size={16}/>, module: 'MODULE_ORGANIZATION', feature: 'FEATURE_ORGANIZATIONS',    superAdminOnly: true },
    { name: 'Business Units',   path: '/platform/business-units',   icon: <FcDepartment size={16}/>,   module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_UNITS',   superAdminOnly: true },
    { name: 'BU-Module Mapping', path: '/platform/bu-module-mapping', icon: <FcPackage size={16}/>,    module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_UNITS',   superAdminOnly: true },
    { name: 'BU Subscriptions', path: '/platform/bu-subscriptions', icon: <FcCurrencyExchange size={16}/>, module: 'MODULE_ORGANIZATION', feature: 'FEATURE_BUSINESS_UNITS', superAdminOnly: true },
  ]},
  { name: 'Identity & Access', items: [
    { name: 'Users Management', path: '/platform/user-management',           icon: <FcConferenceCall size={16}/>, module: 'MODULE_IAM', feature: 'FEATURE_USERS_MANAGEMENT',    superAdminOnly: true },
    { name: 'User-BU Mapping',  path: '/platform/user-bu-mapping',           icon: <FcGenealogy size={16}/>,      module: 'MODULE_IAM', feature: 'FEATURE_USER_BU_MAPPING',     superAdminOnly: true },
    { name: 'Roles Management', path: '/platform/roles',                     icon: <FcPrivacy size={16}/>,        module: 'MODULE_IAM', feature: 'FEATURE_ROLES_MANAGEMENT',    superAdminOnly: true },
    { name: 'Role Templates',   path: '/platform/role-permission-templates', icon: <FcTimeline size={16}/>,       module: 'MODULE_IAM', feature: 'FEATURE_ROLES_MANAGEMENT',    superAdminOnly: true },
    { name: 'Permissions',      path: '/platform/permissions',               icon: <FcList size={16}/>,           module: 'MODULE_IAM', feature: 'FEATURE_PERMISSION_REGISTRY', superAdminOnly: true },
  ]},
  { name: 'Tenancy & Billing', items: [
    { name: 'Tenancy Management', path: '/platform/tenancy',         icon: <FcGlobe size={16}/>,          module: 'MODULE_TENANCY',  feature: 'FEATURE_TENANCY',          superAdminOnly: true },
    { name: 'Tenant Settings',    path: '/platform/tenant-settings', icon: <FcSettings size={16}/>,       module: 'MODULE_TENANCY',  feature: 'FEATURE_TENANT_SETTINGS',  superAdminOnly: true },
    { name: 'Tenant Domains',     path: '/platform/tenant-domains',  icon: <FcGrid size={16}/>,           module: 'MODULE_TENANCY',  feature: 'FEATURE_TENANT_DOMAINS',   superAdminOnly: true },
    { name: 'Tenant Admin',       path: '/platform/tenant-admin',    icon: <FcManager size={16}/>,        module: 'MODULE_TENANCY',  feature: 'FEATURE_TENANT_ADMIN',     superAdminOnly: true },
    { name: 'Module Registry',    path: '/platform/module-registry', icon: <FcPackage size={16}/>,        module: 'MODULE_PLATFORM', feature: 'FEATURE_MODULE_REGISTRY',  superAdminOnly: true },
  ]},
  { name: 'Developer Tools', items: [
    { name: 'Integrations',    path: '/settings/integrations',  icon: <FcElectricalSensor size={16}/>, module: 'MODULE_PLATFORM', feature: 'FEATURE_INTEGRATIONS',   superAdminOnly: true },
    { name: 'API Keys',        path: '/platform/api-keys',      icon: <FcKey size={16}/>,              module: 'MODULE_PLATFORM', feature: 'FEATURE_API_KEYS',       superAdminOnly: true },
    { name: 'Webhooks',        path: '/platform/webhooks',      icon: <FcLink size={16}/>,             module: 'MODULE_PLATFORM', feature: 'FEATURE_WEBHOOKS',       superAdminOnly: true },
    { name: 'Feature Flags',   path: '/settings/features',      icon: <FcRating size={16}/>,           module: 'MODULE_PLATFORM', feature: 'FEATURE_FEATURE_FLAGS',  superAdminOnly: true },
    { name: 'Background Jobs', path: '/platform/jobs',          icon: <FcOvertime size={16}/>,         module: 'MODULE_PLATFORM', feature: 'FEATURE_JOBS',           superAdminOnly: true },
    { name: 'File Storage',    path: '/settings/file-storage',  icon: <FcDataSheet size={16}/>,        module: 'MODULE_PLATFORM', feature: 'FEATURE_FILE_STORAGE',   superAdminOnly: true },
    { name: 'Branding',        path: '/settings/branding',      icon: <FcTemplate size={16}/>,         module: 'MODULE_PLATFORM', feature: 'FEATURE_BRANDING',       superAdminOnly: true },
  ]},
  { name: 'Monitoring & Security', items: [
    { name: 'Health Monitor',  path: '/platform/health',                 icon: <FcOk size={16}/>,           module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_HEALTH',       superAdminOnly: true },
    { name: 'Diagnostics',     path: '/support/diagnostics',             icon: <FcInspection size={16}/>,   module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_DIAGNOSTICS',  superAdminOnly: true },
    { name: 'Metrics',         path: '/platform/observability/metrics',  icon: <FcComboChart size={16}/>,   module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_METRICS',      superAdminOnly: true },
    { name: 'Traces',          path: '/platform/observability/traces',   icon: <FcLineChart size={16}/>,    module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_TRACES',       superAdminOnly: true },
    { name: 'Audit Log',       path: '/platform/audit',                  icon: <FcBarChart size={16}/>,     module: 'MODULE_COMPLIANCE',   feature: 'FEATURE_AUDIT_LOG',    superAdminOnly: true },
    { name: 'Error Log',       path: '/platform/errors',                 icon: <FcHighPriority size={16}/>, module: 'MODULE_COMPLIANCE',   feature: 'FEATURE_ERROR_LOG',    superAdminOnly: true },
    { name: 'Support Center',  path: '/support',                         icon: <FcOnlineSupport size={16}/>,module: 'MODULE_OBSERVABILITY', feature: 'FEATURE_SUPPORT',     superAdminOnly: true },
    { name: 'Break Glass',     path: '/platform/break-glass',            icon: <FcHighPriority size={16}/>, module: 'MODULE_COMPLIANCE',   feature: 'FEATURE_BREAK_GLASS',  superAdminOnly: true },
  ]},
  {
    name: 'HR & PAYROLL',
    subGroups: [
      { name: 'Self Service', items: [
        { name: 'My Attendance',    path: '/workspace/my-attendance',   icon: <FcClock size={16}/>,           module: 'MODULE_ATTENDANCE', feature: 'FEATURE_MY_ATTENDANCE' },
        { name: 'My Leave',         path: '/workspace/my-leave',        icon: <FcCalendar size={16}/>,        module: 'MODULE_LEAVE',      feature: 'FEATURE_MY_LEAVE' },
        { name: 'My Payslips',      path: '/workspace/my-payslips',     icon: <FcDataSheet size={16}/>,       module: 'MODULE_PAYROLL',    feature: 'FEATURE_MY_PAYSLIPS' },
        { name: 'My Appraisals',    path: '/workspace/my-appraisals',   icon: <FcSalesPerformance size={16}/>,module: 'MODULE_APPRAISAL',  feature: 'FEATURE_MY_APPRAISALS' },
      ]},
      { name: 'Team Management', items: [
        { name: 'Team Attendance',  path: '/workspace/team-attendance', icon: <FcOvertime size={16}/>,        module: 'MODULE_ATTENDANCE', feature: 'FEATURE_TEAM_ATTENDANCE' },
        { name: 'Team Leave',       path: '/workspace/team-leave',      icon: <FcCalendar size={16}/>,        module: 'MODULE_LEAVE',      feature: 'FEATURE_TEAM_LEAVE' },
        { name: 'Team Appraisals',  path: '/workspace/team-appraisals', icon: <FcManager size={16}/>,         module: 'MODULE_APPRAISAL',  feature: 'FEATURE_TEAM_APPRAISALS' },
      ]},
      { name: 'Core HR', items: [
        { name: 'HR Dashboard',     path: '/hrms/dashboard',            icon: <FcComboChart size={16}/>,      module: 'MODULE_HRMS', feature: 'FEATURE_HRMS_DASHBOARD' },
        { name: 'Departments',      path: '/hrms/departments',          icon: <FcDepartment size={16}/>,      module: 'MODULE_HRMS', feature: 'FEATURE_DEPARTMENTS' },
        { name: 'Designations',     path: '/hrms/designations',         icon: <FcRating size={16}/>,          module: 'MODULE_HRMS', feature: 'FEATURE_DESIGNATIONS' },
        { name: 'Employees',        path: '/hrms/employees',            icon: <FcManager size={16}/>,         module: 'MODULE_HRMS', feature: 'FEATURE_EMPLOYEE_DIRECTORY' },
        { name: 'Employee 360°',    path: '/hrms/employee-360',         icon: <FcConferenceCall size={16}/>,  module: 'MODULE_HRMS', feature: 'FEATURE_EMPLOYEE_360' },
        { name: 'Org Chart',        path: '/hrms/org-chart',            icon: <FcGenealogy size={16}/>,       module: 'MODULE_HRMS', feature: 'FEATURE_ORG_CHART' },
      ]},
      { name: 'Employee Lifecycle', items: [
        { name: 'Onboarding',       path: '/hrms/lifecycle/onboarding', icon: <FcOk size={16}/>,              module: 'MODULE_HRMS', feature: 'FEATURE_ONBOARDING' },
        { name: 'Assets',           path: '/hrms/lifecycle/assets',     icon: <FcPackage size={16}/>,         module: 'MODULE_HRMS', feature: 'FEATURE_ASSETS' },
        { name: 'Offboarding',      path: '/hrms/lifecycle/offboarding',icon: <FcBusinessman size={16}/>,     module: 'MODULE_HRMS', feature: 'FEATURE_OFFBOARDING' },
      ]},
      { name: 'Attendance & Leave', items: [
        { name: 'Shifts & Planning',     path: '/hrms/shift-planning',  icon: <FcOvertime size={16}/>,        module: 'MODULE_ATTENDANCE', feature: 'FEATURE_SHIFTS' },
        { name: 'Attendance Dashboard',  path: '/hrms/attendance',      icon: <FcClock size={16}/>,           module: 'MODULE_ATTENDANCE', feature: 'FEATURE_ATTENDANCE_DASHBOARD' },
        { name: 'Holidays',              path: '/hrms/holidays',        icon: <FcInfo size={16}/>,            module: 'MODULE_LEAVE',      feature: 'FEATURE_HOLIDAYS' },
        { name: 'Leave Management',      path: '/hrms/leave',           icon: <FcCalendar size={16}/>,        module: 'MODULE_LEAVE',      feature: 'FEATURE_LEAVE_MANAGEMENT' },
      ]},
      { name: 'Payroll', items: [
        { name: 'Payroll Dashboard',path: '/hrms/payroll/dashboard',    icon: <FcMoneyTransfer size={16}/>,   module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYROLL_DASHBOARD' },
        { name: 'Salary Structures',path: '/hrms/payroll/structures',   icon: <FcBarChart size={16}/>,        module: 'MODULE_PAYROLL', feature: 'FEATURE_SALARY_STRUCTURES' },
        { name: 'IT Declarations',  path: '/hrms/payroll/it',           icon: <FcSalesPerformance size={16}/>,module: 'MODULE_PAYROLL', feature: 'FEATURE_IT_DECLARATIONS' },
        { name: 'Payslips',         path: '/hrms/payroll/payslips',     icon: <FcDataSheet size={16}/>,       module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYSLIPS' },
        { name: 'Compliance',       path: '/hrms/payroll/compliance',   icon: <FcOk size={16}/>,              module: 'MODULE_PAYROLL', feature: 'FEATURE_PAYROLL_COMPLIANCE' },
      ]},
      { name: 'Recruitment', items: [
        { name: 'Job Openings',     path: '/hrms/recruitment/jobs',         icon: <FcBriefcase size={16}/>,   module: 'MODULE_RECRUITMENT', feature: 'FEATURE_JOB_POSTINGS' },
        { name: 'Candidates',       path: '/hrms/recruitment/candidates',   icon: <FcManager size={16}/>,     module: 'MODULE_RECRUITMENT', feature: 'FEATURE_CANDIDATES' },
        { name: 'Interviews',       path: '/hrms/recruitment/interviews',   icon: <FcConferenceCall size={16}/>,module: 'MODULE_RECRUITMENT', feature: 'FEATURE_INTERVIEWS' },
      ]},
      { name: 'Performance', items: [
        { name: 'Goals',            path: '/hrms/performance/goals',    icon: <FcSalesPerformance size={16}/>,module: 'MODULE_APPRAISAL', feature: 'FEATURE_GOALS' },
        { name: 'Appraisal Cycles', path: '/hrms/performance/cycles',   icon: <FcRating size={16}/>,          module: 'MODULE_APPRAISAL', feature: 'FEATURE_APPRAISAL_CYCLES' },
        { name: 'Reviews',          path: '/hrms/performance/reviews',  icon: <FcInspection size={16}/>,      module: 'MODULE_APPRAISAL', feature: 'FEATURE_REVIEWS' },
      ]},
    ],
  },
  {
    name: 'PQM',
    subGroups: [
      { name: 'Overview', items: [
        { name: 'Project Management', path: '/pqm/projects', icon: <FcComboChart size={16}/>, module: 'MODULE_PQM', feature: 'FEATURE_PQM_DASHBOARD' },
        { name: 'NC Management', path: '/pqm/nc-management', icon: <FcInspection size={16}/>, module: 'MODULE_PQM', feature: 'FEATURE_PQM_NC_LIST' },
      ]},
      { name: 'Configuration', items: [
        { name: 'PQM Settings', path: '/pqm/config', icon: <FcSettings size={16}/>, module: 'MODULE_PQM', feature: 'FEATURE_PQM_CONFIG' },
      ]},
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────────────────── */
interface GroupTheme { hex: string; rgb: string; icon: React.ReactNode; label: string; }

const GROUP_THEME: Record<string, GroupTheme> = {
  'Overview':              { hex: '#7C3AED', rgb: '124,58,237', icon: <Activity size={14}/>, label: 'Overview' },
  'Organization':          { hex: '#7C3AED', rgb: '124,58,237', icon: <Users size={14}/>,    label: 'Organization' },
  'Identity & Access':     { hex: '#7C3AED', rgb: '124,58,237', icon: <Shield size={14}/>,   label: 'Identity & Access' },
  'Tenancy & Billing':     { hex: '#7C3AED', rgb: '124,58,237', icon: <CreditCard size={14}/>,label: 'Tenancy & Billing' },
  'Developer Tools':       { hex: '#7C3AED', rgb: '124,58,237', icon: <Server size={14}/>,   label: 'Developer Tools' },
  'Monitoring & Security': { hex: '#7C3AED', rgb: '124,58,237', icon: <BarChart2 size={14}/>,label: 'Monitoring & Security' },
  'HR & PAYROLL':          { hex: '#059669', rgb: '5,150,105',   icon: <Users size={14}/>,     label: 'HR & Payroll'    },
  'PQM':       { hex: '#D97706', rgb: '217,119,6',   icon: <BarChart2 size={14}/>, label: 'PQM' },
};

const SG_ICON: Record<string, React.ReactNode> = {
  // Core Platform subgroups
  'Overview':               <Activity size={11}/>,
  'Organization':           <Users size={11}/>,
  'Identity & Access':      <Shield size={11}/>,
  'Tenancy & Billing':      <CreditCard size={11}/>,
  'Developer Tools':        <Server size={11}/>,
  'Monitoring & Security':  <BarChart2 size={11}/>,
  // HR & Payroll subgroups
  'Self Service':           <User size={11}/>,
  'Team Management':        <Users size={11}/>,
  'Core HR':                <Users size={11}/>,
  'Employee Lifecycle':     <Briefcase size={11}/>,
  'Attendance & Leave':     <Clock size={11}/>,
  'Payroll':                <CreditCard size={11}/>,
  'Recruitment':            <Briefcase size={11}/>,
  'Performance':            <TrendingUp size={11}/>,
  // Project Quality subgroups
  'Non-Conformances':       <Shield size={11}/>,
  'Configuration':          <Settings size={11}/>,
};

const FALLBACK: GroupTheme = { hex: '#6B7280', rgb: '107,114,128', icon: <LayoutGrid size={14}/>, label: 'Other' };

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION CONFIG
───────────────────────────────────────────────────────────────────────────── */
interface SectionCfg {
  key: string; label: string; tagline: string;
  hex: string; rgb: string; dimHex: string;
  icon: React.ReactNode; groups: string[];
}

const SECTIONS: SectionCfg[] = [
  {
    key: 'core', label: 'Core Platform', tagline: 'Admin & Infrastructure',
    hex: '#7C3AED', rgb: '124,58,237', dimHex: '#4C1D95',
    icon: <Cpu size={11}/>,
    groups: ['Overview', 'Organization', 'Identity & Access', 'Tenancy & Billing', 'Developer Tools', 'Monitoring & Security'],
  },
  {
    key: 'operational', label: 'Operational', tagline: 'HR · Payroll · Quality',
    hex: '#059669', rgb: '5,150,105', dimHex: '#064E3B',
    icon: <Network size={11}/>,
    groups: ['HR & PAYROLL', 'PQM'],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const EXACT = new Set(['/', '/dashboard', '/platform']);
const sgKey = (p: string, s: string) => `${p}::${s}`;
const leafCount = (g: NavGroup) =>
  (g.items?.length ?? 0) + (g.subGroups?.reduce((n, sg) => n + sg.items.length, 0) ?? 0);

/* ─────────────────────────────────────────────────────────────────────────────
   LEAF  (Level-3 nav item)
───────────────────────────────────────────────────────────────────────────── */
function Leaf({
  item, theme, collapsed, animate, delay, isActive,
}: {
  item: NavLeaf; theme: GroupTheme; collapsed: boolean;
  animate: boolean; delay: number; isActive: (p: string) => boolean;
}) {
  const active = isActive(item.path);
  const { t }  = useTranslation();
  const label  = t(`navigation.items.${item.name.replace(/[^a-zA-Z0-9]/g, '_')}`, item.name);

  return (
    <NavLink
      to={item.path}
      end={EXACT.has(item.path)}
      style={{ animation: animate ? `sb5SlideRight 0.18s ease ${delay}ms both` : 'none' }}
      className={cn(
        'group/leaf relative flex items-center gap-2.5 outline-none select-none',
        'transition-all duration-200 rounded-lg',
        collapsed ? 'h-9 w-9 mx-auto justify-center' : 'h-8 px-2',
      )}
    >
      {/* Active pill background */}
      {active && !collapsed && (
        <span
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ background: `linear-gradient(135deg, rgba(${theme.rgb},0.15), rgba(${theme.rgb},0.06))` }}
        />
      )}
      {/* Hover wash */}
      {!active && (
        <span
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover/leaf:opacity-100 transition-opacity duration-150"
          style={{ background: `rgba(${theme.rgb},0.06)` }}
        />
      )}

      {/* Active left bar */}
      {active && !collapsed && (
        <span
          className="absolute left-0 inset-y-[6px] w-[3px] rounded-r-full pointer-events-none"
          style={{
            background: theme.hex,
            animation: 'sb5BarGrow 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
            boxShadow: `2px 0 8px rgba(${theme.rgb},0.5)`,
          }}
        />
      )}

      {/* Icon */}
      <span
        className={cn(
          'relative shrink-0 flex items-center justify-center transition-transform duration-200',
          'group-hover/leaf:scale-110',
          collapsed ? 'h-8 w-8 rounded-lg' : 'h-6 w-6 rounded-md',
          active && collapsed && 'ring-1 ring-offset-[3px] ring-offset-transparent',
        )}
        style={active ? {
          animation: 'sb5ScalePop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
          '--tw-ring-color': theme.hex,
        } as React.CSSProperties : undefined}
      >
        {item.icon}
        {/* Dot for collapsed active */}
        {active && collapsed && (
          <span
            className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full border-2 border-[hsl(var(--sidebar-bg))]"
            style={{
              background: theme.hex,
              boxShadow: `0 0 6px 2px rgba(${theme.rgb},0.7)`,
            }}
          />
        )}
      </span>

      {/* Label */}
      {!collapsed && (
        <span className={cn(
          'flex-1 truncate text-[12.5px] leading-none transition-colors duration-200',
          active
            ? 'font-semibold'
            : 'font-medium text-[hsl(var(--muted-foreground))] group-hover/leaf:text-[hsl(var(--foreground))]',
        )}
        style={active ? { color: theme.hex } : undefined}
        >
          {label}
        </span>
      )}

      {/* Tooltip (collapsed) */}
      {collapsed && (
        <span
          className={cn(
            'pointer-events-none absolute left-full ml-3 z-[60]',
            'px-2.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap',
            'opacity-0 -translate-x-1 scale-95 group-hover/leaf:opacity-100 group-hover/leaf:translate-x-0 group-hover/leaf:scale-100',
            'transition-all duration-150 ease-out shadow-2xl',
            'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]',
          )}
        >
          {label}
        </span>
      )}
    </NavLink>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION LABEL ROW
───────────────────────────────────────────────────────────────────────────── */
function SectionRow({
  cfg, count, collapsed, allOpen, onToggleAll,
}: {
  cfg: SectionCfg; count: number; collapsed: boolean;
  allOpen: boolean; onToggleAll: () => void;
}) {
  if (collapsed) return null;
  return (
    <div
      className="mx-3 mb-1 mt-2 flex items-center gap-2"
      style={{ animation: 'sb5SectionFadeIn 0.25s ease both' }}
    >
      {/* Icon chip */}
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px]"
        style={{ background: `rgba(${cfg.rgb},0.18)`, color: cfg.hex }}
      >
        {cfg.icon}
      </span>

      {/* Label only — no count */}
      <div className="flex-1 min-w-0 flex items-center">
        <span
          className="text-[12.5px] font-extrabold uppercase tracking-[0.10em] leading-none"
          style={{ color: cfg.hex }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Single expand/collapse toggle button */}
      <button
        onClick={onToggleAll}
        title={allOpen ? 'Collapse all' : 'Expand all'}
        className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] transition-all duration-200 hover:scale-110"
        style={{
          background: `rgba(${cfg.rgb},0.12)`,
          color: cfg.hex,
          transform: allOpen ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
      >
        <span
          className="transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center"
          style={{ transform: allOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          <ChevronsDownUp size={11} strokeWidth={2.5}/>
        </span>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DIVIDER between sections — animated flowing shimmer line
───────────────────────────────────────────────────────────────────────────── */
function SectionDivider({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="mx-auto my-2.5 h-px w-6 rounded-full sb5-divider-line" />
    );
  }
  return (
    <div className="relative mx-3 my-3 flex items-center gap-0">
      {/* Left flowing line */}
      <div className="flex-1 h-px sb5-divider-line rounded-l-full" />

      {/* Center label chip */}
      <div
        className="flex shrink-0 items-center gap-[5px] px-2.5 py-[4px] mx-2 rounded-full select-none"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(5,150,105,0.10) 100%)',
          border: '1px solid rgba(124,58,237,0.22)',
          boxShadow: '0 0 10px rgba(124,58,237,0.08)',
        }}
      >
        {/* Animated dot – purple */}
        <span
          className="h-[5px] w-[5px] rounded-full shrink-0"
          style={{
            background: '#7C3AED',
            animation: 'sb5GlowPulse 2s ease-in-out infinite',
            '--sb5-glow': 'rgba(124,58,237,0.5)',
          } as React.CSSProperties}
        />
        <span
          className="text-[9px] font-extrabold uppercase tracking-[0.13em] leading-none"
          style={{
            background: 'linear-gradient(90deg, #7C3AED 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Operational
        </span>
        {/* Animated dot – green */}
        <span
          className="h-[5px] w-[5px] rounded-full shrink-0"
          style={{
            background: '#059669',
            animation: 'sb5GlowPulse 2s ease-in-out infinite 1s',
            '--sb5-glow': 'rgba(5,150,105,0.5)',
          } as React.CSSProperties}
        />
      </div>

      {/* Right flowing line */}
      <div className="flex-1 h-px sb5-divider-line rounded-r-full" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GROUP HEADER  (Level-1)
───────────────────────────────────────────────────────────────────────────── */
function GroupHeader({
  group, theme, open, collapsed, onClick,
}: {
  group: NavGroup; theme: GroupTheme; open: boolean; collapsed: boolean; onClick: () => void;
}) {
  const { t } = useTranslation();
  const count  = leafCount(group);
  const label  = t(`navigation.groups.${group.name.replace(/[^a-zA-Z0-9]/g, '_')}`, theme.label);

  if (collapsed) {
    return (
      <div className="group/gh relative flex justify-center py-0.5">
        <button
          onClick={onClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
          style={{
            background: open ? `rgba(${theme.rgb},0.18)` : `rgba(${theme.rgb},0.07)`,
            color: theme.hex,
          }}
        >
          {theme.icon}
        </button>
        <span
          className={cn(
            'pointer-events-none absolute left-full ml-3 z-[60] whitespace-nowrap',
            'px-2.5 py-1.5 rounded-lg text-[12px] font-semibold',
            'opacity-0 -translate-x-1 scale-95 group-hover/gh:opacity-100 group-hover/gh:translate-x-0 group-hover/gh:scale-100',
            'transition-all duration-150 ease-out shadow-2xl',
          )}
          style={{ background: theme.hex, color: '#fff' }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group/gh relative w-full flex items-center gap-2.5 px-2.5 rounded-xl transition-all duration-200 outline-none',
        'h-9 hover:bg-[hsl(var(--muted)/0.6)]',
      )}
    >

      {/* Icon pill */}
      <span
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg transition-all duration-200"
        style={{
          background: open ? `rgba(${theme.rgb},0.18)` : `rgba(${theme.rgb},0.08)`,
          color: theme.hex,
        }}
      >
        {theme.icon}
      </span>

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-left text-[12.5px] truncate transition-colors duration-200 leading-none',
          open
            ? 'font-bold text-[hsl(var(--foreground))]'
            : 'font-semibold text-[hsl(var(--muted-foreground))] group-hover/gh:text-[hsl(var(--foreground))]',
        )}
      >
        {label}
      </span>

      {/* Chevron */}
      <ChevronDown
        size={12} strokeWidth={2.5}
        className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          color: open ? theme.hex : 'hsl(var(--muted-foreground))',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUBGROUP HEADER  (Level-2)
───────────────────────────────────────────────────────────────────────────── */
function SubGroupHeader({
  sg, theme, open, onClick,
}: {
  sg: NavSubGroup; theme: GroupTheme; open: boolean; onClick: () => void;
}) {
  const { t } = useTranslation();
  const label  = t(`navigation.subgroups.${sg.name.replace(/[^a-zA-Z0-9]/g, '_')}`, sg.name);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group/sg w-full flex items-center gap-2 px-2 rounded-lg outline-none transition-all duration-200',
        'h-7 hover:bg-[hsl(var(--muted)/0.5)]',
      )}
    >
      {/* Tiny icon chip */}
      <span
        className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] transition-colors duration-200"
        style={{
          background: open ? `rgba(${theme.rgb},0.15)` : `rgba(${theme.rgb},0.07)`,
          color: open ? theme.hex : `rgba(${theme.rgb},0.65)`,
        }}
      >
        {SG_ICON[sg.name] ?? <LayoutList size={9}/>}
      </span>

      {/* Label */}
      <span
        className={cn(
          'flex-1 text-left text-[11.5px] truncate transition-colors duration-200 leading-none',
          open
            ? 'font-semibold text-[hsl(var(--foreground))]'
            : 'font-medium text-[hsl(var(--muted-foreground))] group-hover/sg:text-[hsl(var(--foreground))]',
        )}
      >
        {label}
      </span>

      <ChevronDown
        size={11} strokeWidth={2.5}
        className="shrink-0 transition-transform duration-250"
        style={{
          color: open ? theme.hex : 'hsl(var(--muted-foreground))',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export function Sidebar() {
  const { t }                                 = useTranslation();
  const { isCollapsed, toggleCollapse, sidebarWidth, setSidebarWidth } = useSidebarStore();
  const { isSuperAdmin, hasPermission }        = useAuthStore();
  const { branding, businessUnit, subscribedModules, subscribedFeatures } = useTenantContext();
  const location                              = useLocation();

  /* ── Resizable ────────────────────────────────────────────────────────── */
  const [isDragging, setIsDragging] = useState(false);
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const w = Math.min(600, Math.max(200, e.clientX));
      setSidebarWidth(w);
    };
    const onUp = () => { if (isDragging) { setIsDragging(false); document.body.style.cursor = ''; document.body.style.userSelect = ''; } };
    if (isDragging) { document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging, setSidebarWidth]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setIsDragging(true);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  }, []);

  /* ── State ────────────────────────────────────────────────────────────── */
  const [query,       setQuery]       = useState('');
  const [openGroups,  setOpenGroups]  = useState<Set<string>>(() => new Set(NAVIGATION.map(g => g.name)));
  const [openSubs,    setOpenSubs]    = useState<Set<string>>(() => {
    const s = new Set<string>();
    NAVIGATION.forEach(g => g.subGroups?.forEach(sg => s.add(sgKey(g.name, sg.name))));
    return s;
  });

  const isSearching = query.trim().length > 0;

  /* ── Branding ─────────────────────────────────────────────────────────── */
  let logo: string | null = null;
  let displayName         = businessUnit?.name || 'Platform';
  if (isSuperAdmin) { logo = '/images/branding/YSS_Logo.png'; displayName = 'YSS Orbit'; }
  else              { logo = '/images/tenants/paynex.png'; }
  const initial = displayName[0] ?? 'P';

  /* ── Toggle helpers ───────────────────────────────────────────────────── */
  const toggleGroup = useCallback((n: string) => {
    setOpenGroups(p => { const s = new Set(p); s.has(n) ? s.delete(n) : s.add(n); return s; });
  }, []);
  const toggleSub = useCallback((gn: string, sn: string) => {
    const k = sgKey(gn, sn);
    setOpenSubs(p => { const s = new Set(p); s.has(k) ? s.delete(k) : s.add(k); return s; });
  }, []);

  const expandSection = useCallback((groups: string[]) => {
    setOpenGroups(p => { const s = new Set(p); groups.forEach(n => s.add(n)); return s; });
    setOpenSubs(p => {
      const s = new Set(p);
      NAVIGATION.forEach(g => { if (groups.includes(g.name)) g.subGroups?.forEach(sg => s.add(sgKey(g.name, sg.name))); });
      return s;
    });
  }, []);
  const collapseSection = useCallback((groups: string[]) => {
    setOpenGroups(p => { const s = new Set(p); groups.forEach(n => s.delete(n)); return s; });
    setOpenSubs(p => {
      const s = new Set(p);
      NAVIGATION.forEach(g => { if (groups.includes(g.name)) g.subGroups?.forEach(sg => s.delete(sgKey(g.name, sg.name))); });
      return s;
    });
  }, []);

  /* ── Filter / Map leaves ──────────────────────────────────────────────── */
  const filterLeaf = useCallback((lf: NavLeaf) => {
    if (isSuperAdmin) return true;
    if (lf.superAdminOnly) return false;
    if (lf.module    && !subscribedModules.includes(lf.module))   return false;
    if (lf.feature   && !subscribedFeatures.includes(lf.feature)) return false;
    if (lf.permission && !hasPermission(lf.permission))           return false;
    return true;
  }, [isSuperAdmin, subscribedModules, subscribedFeatures, hasPermission]);

  const pqmProjectId = location.pathname.match(/^\/pqm\/([a-f0-9-]+)/i)?.[1] ?? null;

  const mapLeaf = useCallback((lf: NavLeaf): NavLeaf => {
    if (lf.name === 'Dashboard' && isSuperAdmin) return { ...lf, name: 'Platform', path: '/platform' };
    if (pqmProjectId && lf.module === 'MODULE_PQM') {
      if      (lf.path === '/pqm/nc')        return { ...lf, path: `/pqm/nc-management/${pqmProjectId}/nc` };
      else if (lf.path === '/pqm/nc/create') return { ...lf, path: `/pqm/nc-management/${pqmProjectId}/nc/create` };
      else if (lf.path === '/pqm/config')    return { ...lf, path: `/pqm/nc-management/${pqmProjectId}/config` };
      else if (lf.path === '/pqm')           return { ...lf, path: `/pqm/nc-management/${pqmProjectId}` };
    }
    return lf;
  }, [isSuperAdmin, pqmProjectId]);

  const baseNav = useMemo((): NavGroup[] =>
    NAVIGATION.map((g): NavGroup | null => {
      const r: NavGroup = { name: g.name };
      if (g.items)     r.items     = g.items.map(mapLeaf).filter(filterLeaf);
      if (g.subGroups) r.subGroups = g.subGroups.map(sg => ({ ...sg, items: sg.items.map(mapLeaf).filter(filterLeaf) })).filter(sg => sg.items.length);
      return (r.items?.length || r.subGroups?.length) ? r : null;
    }).filter(Boolean) as NavGroup[]
  , [mapLeaf, filterLeaf]);

  const displayNav = useMemo((): NavGroup[] => {
    if (!isSearching) return baseNav;
    const q = query.toLowerCase();
    return baseNav.map((g): NavGroup | null => {
      if (g.items) { const items = g.items.filter(i => i.name.toLowerCase().includes(q)); return items.length ? { name: g.name, items } : null; }
      if (g.subGroups) { const sgs = g.subGroups.map(sg => ({ ...sg, items: sg.items.filter(i => i.name.toLowerCase().includes(q)) })).filter(sg => sg.items.length); return sgs.length ? { name: g.name, subGroups: sgs } : null; }
      return null;
    }).filter(Boolean) as NavGroup[];
  }, [baseNav, query, isSearching]);

  const totalHits = displayNav.reduce((n, g) => n + leafCount(g), 0);

  const isActive = useCallback((path: string) =>
    EXACT.has(path) ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/')
  , [location.pathname]);

  /* ── Sectioned nav ────────────────────────────────────────────────────── */
  const sectionedNav = useMemo(() =>
    SECTIONS.map(sec => ({
      sec,
      groups: displayNav.filter(g => sec.groups.includes(g.name)),
    })).filter(s => s.groups.length)
  , [displayNav]);

  /* ──────────────────────────────────────────────────────────────────────── */
  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex flex-col"
      style={{
        width: isCollapsed ? 72 : sidebarWidth,
        background: 'hsl(var(--sidebar-bg))',
        borderRight: '1px solid hsl(var(--sidebar-border))',
        boxShadow: '4px 0 24px rgba(0,0,0,0.07)',
        transition: isDragging
          ? 'none'
          : 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Resize handle ─────────────────────────────────────────────── */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-2.5 z-50 cursor-col-resize group/resize"
          style={{ transform: 'translateX(50%)' }}
        >
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-transparent group-hover/resize:bg-blue-500/40 active:bg-blue-500/70 transition-colors duration-200" />
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex shrink-0 items-center',
          isCollapsed ? 'h-16 justify-center' : 'h-16 px-4',
        )}
        style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}
      >
        {isCollapsed ? (
          <div
            className="h-9 w-9 flex items-center justify-center rounded-xl text-base font-black cursor-pointer select-none transition-transform duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(5,150,105,0.10))', color: '#7C3AED' }}
          >
            {initial}
          </div>
        ) : logo ? (
          <img src={logo} alt={displayName} className="h-9 w-auto max-w-[160px] object-contain transition-transform duration-200 hover:scale-[1.02] cursor-pointer" />
        ) : (
          <div
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl text-base font-black cursor-pointer select-none"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18),rgba(5,150,105,0.10))', color: '#7C3AED' }}
          >
            {initial}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'absolute -right-3.5 top-1/2 -translate-y-1/2 z-20',
            'h-7 w-7 flex items-center justify-center rounded-full',
            'border shadow-md transition-all duration-200 hover:scale-110',
            'bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]',
            'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]',
          )}
        >
          {isCollapsed
            ? <ChevronRight size={12} strokeWidth={2.5}/>
            : <ChevronLeft  size={12} strokeWidth={2.5}/>}
        </button>
      </div>

      {/* ── SEARCH ────────────────────────────────────────────────────── */}
      <div
        className={cn('shrink-0', isCollapsed ? 'p-2.5' : 'px-3 py-2.5')}
        style={{ borderBottom: '1px solid hsl(var(--sidebar-border))' }}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl transition-all duration-200',
            'bg-[hsl(var(--muted))] border border-[hsl(var(--border))]',
            'focus-within:border-[hsl(var(--ring)/0.5)] focus-within:bg-[hsl(var(--background-2))]',
            isCollapsed ? 'h-9 w-9 mx-auto justify-center' : 'px-3 py-2',
          )}
        >
          <Search size={13} className="shrink-0 transition-colors duration-200" style={{ color: query ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}/>
          {!isCollapsed && (
            <>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('navigation.search_menus', 'Search menus…')}
                className="flex-1 bg-transparent outline-none border-none text-[12.5px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="h-4 w-4 flex items-center justify-center rounded-full transition-colors duration-150 bg-[hsl(var(--muted-foreground)/0.25)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted-foreground)/0.4)]"
                >
                  <X size={9} strokeWidth={3}/>
                </button>
              )}
            </>
          )}
        </div>
        {!isCollapsed && isSearching && (
          <p className={cn('mt-1.5 px-1 text-[10.5px] font-medium', totalHits ? 'text-[hsl(var(--muted-foreground))]' : 'text-rose-400')}>
            {totalHits ? `${totalHits} result${totalHits > 1 ? 's' : ''}` : 'No results found'}
          </p>
        )}
      </div>

      {/* ── NAV BODY ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sb5-scroll py-2">
        {displayNav.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Search size={20} className="text-[hsl(var(--muted-foreground)/0.5)]"/>
            <p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]" >No menus found</p>
          </div>
        ) : (
          <nav className="flex flex-col">
            {sectionedNav.map(({ sec, groups }, sIdx) => {
              const sectionCount = groups.reduce((n, g) => n + leafCount(g), 0);
              const isLast       = sIdx === sectionedNav.length - 1;

              return (
                <React.Fragment key={sec.key}>

                  {/* Section label row */}
                  <SectionRow
                    cfg={sec}
                    count={sectionCount}
                    collapsed={isCollapsed}
                    allOpen={sec.groups.every(gn => openGroups.has(gn))}
                    onToggleAll={() => {
                      const anyOpen = sec.groups.some(gn => openGroups.has(gn));
                      if (anyOpen) collapseSection(sec.groups);
                      else expandSection(sec.groups);
                    }}
                  />

                  {/* Groups in this section */}
                  <div className={cn('flex flex-col gap-0.5', isCollapsed ? 'px-2' : 'px-2')}>
                    {groups.map((group, gIdx) => {
                      const theme    = GROUP_THEME[group.name] ?? FALLBACK;
                      const grpOpen  = isSearching || openGroups.has(group.name);
                      const count    = leafCount(group);

                      return (
                        <div key={gIdx}>
                          {/* L1 Group header */}
                          <GroupHeader
                            group={group} theme={theme}
                            open={grpOpen} collapsed={isCollapsed}
                            onClick={() => toggleGroup(group.name)}
                          />

                          {/* Accordion body */}
                          <div style={{
                            maxHeight: grpOpen ? `${count * 52 + (group.subGroups?.length ?? 0) * 36 + 24}px` : '0',
                            opacity:   grpOpen ? 1 : 0,
                            overflow:  'hidden',
                            transition: grpOpen
                              ? 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease 0.04s'
                              : 'max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                          }}>

                            {/* Flat items (dashboard row at top) */}
                            {group.items && (
                              <div className="flex flex-col gap-[1px] py-0.5">
                                {group.items.map((item, iIdx) => (
                                  <Leaf key={iIdx} item={item} theme={theme} collapsed={isCollapsed}
                                    animate={grpOpen} delay={iIdx * 25} isActive={isActive}/>
                                ))}
                              </div>
                            )}

                            {/* Sub-groups */}
                            {group.subGroups && (
                              <div
                                className={cn('flex flex-col gap-0.5 py-0.5 mt-0.5', !isCollapsed && 'ml-5 pl-2.5')}
                                style={!isCollapsed ? { borderLeft: `1px solid rgba(${theme.rgb},0.16)` } : undefined}
                              >
                                {group.subGroups.map((sg, sgIdx) => {
                                  const key    = sgKey(group.name, sg.name);
                                  const sgOpen = isSearching || openSubs.has(key);
                                  const baseD  = (group.items?.length ?? 0) * 22
                                               + group.subGroups!.slice(0, sgIdx).reduce((n, s) => n + s.items.length * 22, 0);

                                  return (
                                    <div key={sgIdx}>
                                      {/* L2 sub-group header */}
                                      {!isCollapsed && (
                                        <SubGroupHeader
                                          sg={sg} theme={theme}
                                          open={sgOpen}
                                          onClick={() => toggleSub(group.name, sg.name)}
                                        />
                                      )}

                                      {/* L3 leaf items */}
                                      <div style={{
                                        maxHeight: sgOpen ? `${sg.items.length * 38 + 4}px` : '0',
                                        opacity:   sgOpen ? 1 : 0,
                                        overflow:  'hidden',
                                        transition: sgOpen
                                          ? 'max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease 0.03s'
                                          : 'max-height 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.12s ease',
                                      }}>
                                        <div
                                          className={cn('flex flex-col gap-[1px] py-0.5', !isCollapsed && 'ml-4 pl-2')}
                                          style={!isCollapsed ? { borderLeft: `1px dashed rgba(${theme.rgb},0.12)` } : undefined}
                                        >
                                          {sg.items.map((item, iIdx) => (
                                            <Leaf key={iIdx} item={item} theme={theme} collapsed={isCollapsed}
                                              animate={sgOpen} delay={baseD + iIdx * 20} isActive={isActive}/>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>

                          {/* Space between groups */}
                          {!isCollapsed && gIdx < groups.length - 1 && <div className="h-1" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider between sections */}
                  {!isLast && <SectionDivider collapsed={isCollapsed} />}

                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      {branding?.branding_mode === 'co_brand' && !isCollapsed && (
        <div
          className="shrink-0 px-4 py-3 flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-300 cursor-default"
          style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}
        >
          <LayoutGrid size={11} className="text-[hsl(var(--muted-foreground))]"/>
          <span className="text-[9.5px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]">
            Powered by Platform
          </span>
        </div>
      )}
    </aside>
  );
}

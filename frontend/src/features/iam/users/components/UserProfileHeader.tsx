import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '@/features/iam/users/types/userTypes';
import { getUserInitials } from '@/features/iam/users/utils/userHelpers';
import { RoleBadge } from './RoleBadge';
import { AlertTriangle, Shield, CheckCircle2, GitBranch, Calendar, Clock, Lock, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { formatIST } from '@/utils/date';

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface UserProfileHeaderProps {
  user: User;
  stats: {
    buCount: number;
    rolesCount: number;
  };
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isReadOnly?: boolean; // True for My Profile (self-service)
  onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarDelete?: () => void;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  stats,
  tabs,
  activeTab,
  onTabChange,
  isReadOnly = false,
  onAvatarUpload,
  onAvatarDelete
}) => {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const isActive = Boolean(user.is_active);
  const isDeleted = Boolean(user.is_deleted);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* ── Premium Profile Card ────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-200/80 dark:border-gray-800/80 overflow-hidden relative">
        
        {/* Profile Details Container */}
        <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          <div className="relative shrink-0">
            <div className="group rounded-[1.5rem] bg-white dark:bg-gray-900 shadow-md ring-1 ring-gray-100 dark:ring-gray-800 p-1.5 relative overflow-hidden">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={name} 
                  className="h-28 w-28 rounded-2xl object-cover" 
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40">
                  <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">
                    {getUserInitials(user)}
                  </span>
                </div>
              )}
              {/* Online Indicator */}
              {isActive && !isDeleted && (
                <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-white dark:border-gray-900 bg-emerald-500 shadow-sm z-10"></div>
              )}
              {/* Edit Avatar Overlay */}
              {onAvatarUpload && (
                <div className="absolute inset-1.5 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-20">
                  <label className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full cursor-pointer transition-colors shadow-sm" title="Upload new image">
                    <Upload className="h-5 w-5" />
                    <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={onAvatarUpload} />
                  </label>
                  {user.avatar && onAvatarDelete && (
                    <button type="button" onClick={onAvatarDelete} className="p-2.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full cursor-pointer transition-colors shadow-sm" title="Remove image">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Info positioned correctly relative to the avatar */}
          <div className="flex-1 flex flex-col justify-center text-center sm:text-left pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{name}</h2>
              <div className="flex gap-2">
                {isDeleted ? (
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">{t('status.archived', 'Archived')}</span>
                ) : isActive ? (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">{t('status.active', 'Active')}</span>
                ) : (
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">{t('status.inactive', 'Inactive')}</span>
                )}
              </div>
            </div>
              
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1.5 font-medium">
              {user.email}
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4 items-center">
              <RoleBadge user={user} />
              {!user.is_email_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> {t('status.email_unverified', 'Email Unverified')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ────────────────────────────────────────────── */}
        <div className="px-6 sm:px-10 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 pt-2 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-8 min-w-max" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "whitespace-nowrap py-4 px-1 text-sm font-bold flex items-center gap-2.5 transition-all relative outline-none",
                    isSelected
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  {Icon && (
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400")} />
                  )}
                  {tab.label}
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Sleek Enterprise KPIs ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* KPI 1: Business Units */}
        <div 
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all",
            !isReadOnly && "cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
          )}
          onClick={() => !isReadOnly && onTabChange('bu_access')}
        >
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
            <GitBranch className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('kpi.business_units', 'Business Units')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.buCount}</div>
          </div>
        </div>

        {/* KPI 2: Roles */}
        <div 
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all",
            !isReadOnly && "cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
          )}
          onClick={() => !isReadOnly && onTabChange('bu_access')}
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('kpi.assigned_roles', 'Assigned Roles')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.rolesCount}</div>
          </div>
        </div>

        {/* KPI 3: Status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border", 
            isActive 
              ? "bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20" 
              : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20"
          )}>
            <CheckCircle2 className={cn("h-5 w-5", isActive ? "text-teal-600 dark:text-teal-400" : "text-rose-600 dark:text-rose-400")} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('kpi.account_status', 'Account Status')}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mt-0.5">{isActive ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}</div>
          </div>
        </div>

        {/* KPI 4: Last Login */}
        <div 
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 transition-all",
            !isReadOnly && "cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md"
          )}
          onClick={() => !isReadOnly && onTabChange('security')}
        >
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('kpi.last_login', 'Last Login')}</div>
            <div className="text-base font-bold text-gray-900 dark:text-white leading-tight mt-1">
              {user.last_login_at ? formatIST(user.last_login_at, 'PPPp') : t('status.never_logged_in', 'Never Logged In')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

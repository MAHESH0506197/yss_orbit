import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '../shell/useSidebarStore';
import { useTenantContext } from '@/store/context/TenantContext';
import { useTheme } from '@/utils/theme/ThemeProvider';
import { LogOut, User, Menu, ChevronRight, Settings, Sun, Moon, ChevronsUpDown } from 'lucide-react';
import api from '@/api/client';
import { cn } from '@/utils/cn';
import { getUserInitials } from '@/features/iam/users/utils/userHelpers';

// Subcomponents
import { HeaderActions } from './HeaderActions';

// Store
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export function Header() {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { firstName, lastName, username, email, avatar, clearAuth, allowedBusinessUnits, selectedBusinessUnitId, selectBusinessUnit, isSuperAdmin } = useAuthStore();
  const { branding } = useTenantContext();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Workspace Context
  const { pageTitle, moduleBadge, environmentBadge, statistics, actions } = useWorkspaceStore();

  const hideBUSelector = location.pathname.startsWith('/platform') || location.pathname.startsWith('/iam');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  // Fallback Breadcrumbs / Title
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return [t('navigation.items.Dashboard', 'Dashboard')];
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
      return paths.map(p => {
        if (uuidRegex.test(p)) return t('navigation.details', 'Details');
        if (p.toLowerCase() === 'nc-management') return 'NC Management';
        
        // Capitalize and replace hyphens with underscores to match our JSON keys
        // e.g. "business-units" -> "Business_Units"
        const keyParts = p.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1));
        const key = keyParts.join('_');
        let fallback = keyParts.join(' ');
        
        // Manual overrides for routes that don't match exactly
        if (p === 'modules') fallback = 'Module Registry';
        if (p === 'api-keys') fallback = 'API Consumer Keys';
        if (p === 'dashboard' && paths[0] === 'platform') return 'Platform Dashboard';
        if (p.toLowerCase() === 'projects') fallback = 'Project Management';
        
        return t(`navigation.items.${key}`, fallback);
      });
  }, [location.pathname]);

  const fallbackTitle = breadcrumbs[breadcrumbs.length - 1];
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur shadow-sm transition-all duration-300">
      
      {/* Top Row: Context, Actions, User */}
      <div className="flex min-h-[64px] items-center justify-between px-4 lg:px-6 gap-4">
        
        {/* Zone 1: Sidebar Toggle & Context */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button 
            onClick={toggleCollapse}
            className="rounded-md p-2 hover:bg-muted text-muted-foreground transition-colors shrink-0"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex flex-col min-w-0">
            {/* Breadcrumb & Badges */}
            <div className="flex items-center text-xs font-medium text-muted-foreground mb-0.5 gap-2">
              <div className="flex items-center truncate">
                <span className="truncate">YSS Orbit</span>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight size={12} className="mx-1 shrink-0" />
                    <span className={cn("truncate", index === breadcrumbs.length - 1 && "text-foreground")}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {moduleBadge && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase shrink-0",
                  moduleBadge.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {moduleBadge.label}
                </span>
              )}
              {environmentBadge && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase shrink-0",
                  environmentBadge.color === 'warning' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'
                )}>
                  {environmentBadge.label}
                </span>
              )}
            </div>
            
            {/* Page Title */}
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate tracking-tight">
              {pageTitle || fallbackTitle}
            </h1>
          </div>
        </div>

        {/* Zone 3: Global Actions (Quick Actions) */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <HeaderActions actions={actions} />
        </div>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3 shrink-0">
          
          {/* BU Selector */}
          {!hideBUSelector && allowedBusinessUnits && allowedBusinessUnits.length > 0 && (
            <div className="hidden sm:block">
              <select
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer max-w-[200px] truncate"
                value={selectedBusinessUnitId || ''}
                onChange={(e) => selectBusinessUnit(e.target.value)}
              >
                <option value="" disabled={!isSuperAdmin}>
                  {isSuperAdmin ? t('header.global_no_bu', 'Global (No BU Selected)') : t('header.select_bu', 'Select Business Unit')}
                </option>
                {allowedBusinessUnits.map(bu => (
                  <option key={bu.business_unit_id} value={bu.business_unit_id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            aria-label="Toggle Theme"
          >
            <Sun
              size={18}
              className={cn(
                'absolute transition-all duration-300 ease-in-out',
                isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              )}
            />
            <Moon
              size={18}
              className={cn(
                'absolute transition-all duration-300 ease-in-out',
                isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              )}
            />
          </button>

          
          {/* Workspace Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 rounded-full p-1 hover:bg-muted transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground font-bold text-sm shadow-sm border border-border/50">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <>{getUserInitials({ firstName, lastName, username, email })}</>
                )}
              </div>
              <div className="hidden lg:flex flex-col items-start min-w-[80px]">
                <span className="text-sm font-semibold text-foreground leading-tight truncate">
                  {`${firstName || ''} ${lastName || ''}`.trim() || (isSuperAdmin ? username : null) || t('header.user', 'User')}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight truncate uppercase tracking-wider">
                  {useAuthStore.getState().isSuperAdmin ? t('header.super_admin', 'Super Admin') : t('header.user', 'User')}
                </span>
              </div>
              <ChevronsUpDown size={14} className="text-muted-foreground hidden lg:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <p className="text-sm font-semibold text-foreground truncate">{`${firstName || ''} ${lastName || ''}`.trim() || (isSuperAdmin ? username : t('header.user', 'User'))}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                  {(selectedBusinessUnitId) && (
                    <p className="text-xs text-muted-foreground mt-2 truncate font-medium">
                      {allowedBusinessUnits.find(b => b.business_unit_id === selectedBusinessUnitId)?.name}
                    </p>
                  )}
                </div>
                <div className="py-1">
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors">
                    <User size={16} /> {t('header.my_profile', 'My Profile')}
                  </Link>
                </div>
                <div className="border-t border-border py-1 bg-muted/10">
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 text-left transition-colors">
                    <LogOut size={16} /> {t('header.log_out', 'Log Out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

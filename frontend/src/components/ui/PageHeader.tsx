// src/components/ui/PageHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Page Header — v1.0
// Provides consistent page-level header with:
//  • Breadcrumb trail (optional)
//  • Icon + Title + Subtitle
//  • Count badge on icon
//  • Right-aligned action slot
// Used by: BusinessDomainPage, OrganizationListPage, BusinessUnitListPage, UsersPage
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface PageHeaderProps {
  /** Page icon component (e.g. Globe2, Building2) */
  icon: React.ElementType;
  /** Gradient class for icon background (e.g. 'from-violet-500 via-purple-500 to-fuchsia-600') */
  iconGradient?: string;
  /** Page title (H1) */
  title: string;
  /** Descriptive subtitle below title */
  subtitle?: string;
  /** Count displayed as badge on icon (e.g. total domain count) */
  countBadge?: number;
  /** aria-label for count badge */
  countBadgeLabel?: string;
  /** Breadcrumb items (shown above title) */
  breadcrumbs?: BreadcrumbItem[];
  /** If provided, renders an ArrowLeft back link above breadcrumbs — for detail pages */
  backHref?: string;
  /** If provided (and no backHref), renders an ArrowLeft back button using onClick — for detail pages */
  onBack?: () => void;
  /** Right-aligned content (e.g. "New Domain" button) */
  actions?: React.ReactNode;
  /** Additional CSS class for outer wrapper */
  className?: string;
}

export function PageHeader({
  icon: Icon,
  iconGradient = 'from-violet-500 via-purple-500 to-fuchsia-600',
  title,
  subtitle,
  countBadge,
  countBadgeLabel,
  breadcrumbs,
  backHref,
  onBack,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 ${className}`}>
      {/* Left: icon + title block */}
      <div className="flex items-start gap-4 min-w-0">
        {/* Icon with optional count badge */}
        <div className="relative shrink-0">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} shadow-lg`}
            style={{ boxShadow: `0 8px 24px -4px rgba(124,58,237,0.3)` }}
          >
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          {countBadge !== undefined && (
            <span
              aria-label={countBadgeLabel ?? `${countBadge} total`}
              className="absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-gray-950 shadow"
            >
              {countBadge > 99 ? '99+' : countBadge}
            </span>
          )}
        </div>

        {/* Title block */}
        <div className="min-w-0">
          {/* Back link — for detail pages */}
          {(backHref || onBack) && (
            <div className="mb-1.5">
              {backHref ? (
                <Link
                  to={backHref}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  Back
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                  Back
                </button>
              )}
            </div>
          )}

          {/* Breadcrumb */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1">
              <ol className="flex items-center gap-1 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight
                        className="h-3 w-3 text-gray-400 dark:text-gray-600 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        onClick={crumb.onClick}
                        className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors whitespace-nowrap"
                      >
                        {crumb.label}
                      </Link>
                    ) : crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className={`text-xs font-medium transition-colors whitespace-nowrap ${
                          crumb.active 
                            ? 'text-gray-900 dark:text-white cursor-default' 
                            : 'text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400'
                        }`}
                        disabled={crumb.active}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${
                          crumb.active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                        aria-current="page"
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* H1 Title */}
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 max-w-none leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: action slot */}
      {actions && (
        <div className="shrink-0 flex items-center gap-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;

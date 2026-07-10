import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\pages\payroll\routes\payrollRoutes.tsx
import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

// ── Phase 5 — new full-implementation pages ─────────────────────────────────
const PayrollDashboardPage  = lazy(() => import('../PayrollDashboardPage'));
const PayslipDetailPage     = lazy(() => import('../PayslipDetailPage'));
const ITDeclarationsPage    = lazy(() => import('../ITDeclarationsPage'));
const PayrollReportsPage    = lazy(() => import('../PayrollReportsPage'));
const PayrollCompliancePage = lazy(() => import('../PayrollCompliancePage'));

// ── Pre-existing stub pages (named exports only — resolved via .then) ───────
const PayrollPage         = lazy(() => import('../PayrollPage').then(m => ({ default: m.PayrollPage ?? (m as any).default })));
const PayrollRunPage      = lazy(() => import('../PayrollRunPage').then(m => ({ default: m.PayrollRunPage ?? (m as any).default })));
const SalaryStructurePage = lazy(() => import('../SalaryStructurePage').then(m => ({ default: m.SalaryStructurePage ?? (m as any).default })));
const PayrollExportPage   = lazy(() => import('../PayrollExportPage').then(m => ({ default: m.PayrollExportPage ?? (m as any).default })));
const PayslipPage         = lazy(() => import('../PayslipPage').then(m => ({ default: m.PayslipPage ?? (m as any).default })));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
  </div>
);

const wrap = (C: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<Spinner />}><C /></Suspense>
);

export const payrollRoutes: RouteObject[] = [
  // Phase 5 — primary routes
  { path: '',                element: wrap(PayrollDashboardPage)  },
  { path: 'payslips',        element: wrap(PayslipDetailPage)     },
  { path: 'it-declarations', element: wrap(ITDeclarationsPage)    },
  { path: 'reports',         element: wrap(PayrollReportsPage)    },
  { path: 'compliance',      element: wrap(PayrollCompliancePage) },

  // Legacy routes preserved for backward compat
  { path: 'run',             element: wrap(PayrollRunPage)        },
  { path: 'structures',      element: wrap(SalaryStructurePage)   },
  { path: 'export',          element: wrap(PayrollExportPage)     },
  { path: 'payslip/:id',     element: wrap(PayslipPage)           },
  { path: 'list',            element: wrap(PayrollPage)           },
];

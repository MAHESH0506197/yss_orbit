// yss_orbit\frontend\src\routes\AppRouter.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Layouts and Guards
import { AuthGuard }                    from '@/components/auth/AuthGuard';
import { SuperAdminGuard }              from '@/components/auth/SuperAdminGuard';
import { TenantContextProvider }        from '@/store/context/TenantContext';
import { LoadingScreen }                from '@/components/ui/LoadingScreen';

const HomeRouter = lazy(() => import('@/components/auth/HomeRouter'));

// ── Public Pages ───────────────────────────────────────────────────────────────
const WelcomePage           = lazy(() => import('@/pages/welcome/WelcomePage'));
const LoginPage             = lazy(() => import('@/features/iam/auth/LoginPage'));
const ForgotPasswordPage    = lazy(() => import('@/features/iam/auth/ForgotPasswordPage'));
const ForgotPasswordOTPPage = lazy(() => import('@/features/iam/auth/ForgotPasswordOTPPage'));
const ResetPasswordPage     = lazy(() => import('@/features/iam/auth/ResetPasswordPage'));
const OTPVerifyPage         = lazy(() => import('@/features/iam/auth/OTPVerifyPage'));

// B06 §5.19 post-login routing
const SelectBusinessUnitPage = lazy(() => import('@/features/iam/auth/SelectBusinessUnitPage'));
const NoBusinessUnitPage     = lazy(() => import('@/features/iam/auth/NoBusinessUnitPage'));

// ── Shell ─────────────────────────────────────────────────────────────────────
const PlatformShell = lazy(() => import('@/components/layouts/shell/PlatformShell'));

// ── Navigation route constants (for sidebar / nav menus) ─────────────────────
export const MODULE_ROUTES = {
  // Organization
  organizations:      '/platform/organizations',
  organizationDetail: (id: string) => `/platform/organizations/${id}`,
  // Business Domain
  businessDomains:    '/platform/business-domains',
  businessDomainDetail: (id: string) => `/platform/business-domains/${id}`,
  businessDomainCreate: '/platform/business-domains/new',
  businessDomainEdit:   (id: string) => `/platform/business-domains/${id}/edit`,
  // Business Unit — canonical is /platform/business-units
  businessUnits:      '/platform/business-units',
  businessUnitDetail: (id: string) => `/platform/business-units/${id}`,
  // Users / IAM
  users:              '/platform/user-management',
  userCreate:         () => '/platform/user-management/create',
  userDetail:         (id: string) => `/platform/user-management/${id}`,
  userEdit:           (id: string) => `/platform/user-management/${id}/edit`,
  // User-BU Mapping
  userBuMapping:      '/platform/user-bu-mapping',
  userBuMappingDetail: (id: string) => `/platform/user-bu-mapping/${id}`,
  // PQM
  pqmDashboard: '/pqm',
  pqmNcList:    '/pqm/nc',
  pqmNcCreate:  '/pqm/nc/create',
  pqmNcDetail:  (id: string) => `/pqm/nc/${id}`,
  pqmNcEdit:    (id: string) => `/pqm/nc/${id}/edit`,
  pqmConfig:    '/pqm/config',
} as const;

// ── Guards ────────────────────────────────────────────────────────────────────
import { DomainGuard }             from '@/routes/guards/DomainGuard';
import { ModuleSubscriptionGuard } from '@/routes/guards/ModuleSubscriptionGuard';
import { BusinessUnitGuard }       from '@/routes/guards/BusinessUnitGuard';

// ── Analytics ─────────────────────────────────────────────────────────────────
const DashboardPage = lazy(() => import('@/pages/analytics/DashboardPage'));


const UsersPage      = lazy(() => import('@/pages/iam/UsersPage'));
const UserDetailPage = lazy(() => import('@/features/iam/users/pages/UserDetailPage'));
const UserCreatePage = lazy(() => import('@/features/iam/users/pages/UserCreatePage'));
const UserEditPage   = lazy(() => import('@/features/iam/users/pages/UserEditPage'));
const AccessApprovalsPage = lazy(() => import('@/features/platform/userManagement/AccessApprovalsPage'));
const RolesPage      = lazy(() => import('@/pages/iam/RolesPage'));
const TenancyPage    = lazy(() => import('@/pages/iam/TenancyPage'));

// ── Platform ──────────────────────────────────────────────────────────────────
const PlatformPage             = lazy(() => import('@/pages/platform/PlatformPage'));
const ApiKeysPage              = lazy(() => import('@/features/platform/apiKeys/ApiKeysPage'));
const OrganizationListPage     = lazy(() => import('@/pages/organization/organizationListPage'));
const OrganizationCreatePage   = lazy(() => import('@/pages/organization/organizationCreatePage').then(m => ({ default: m.OrganizationCreatePage })));
const OrganizationEditPage     = lazy(() => import('@/pages/organization/organizationEditPage').then(m => ({ default: m.OrganizationEditPage })));
const OrganizationDetailPage   = lazy(() => import('@/pages/organization/organizationDetailPage').then(m => ({ default: m.OrganizationDetailPage })));
const OrganizationSettingsPage = lazy(() => import('@/pages/organization/OrganizationSettingsPage').then(m => ({ default: m.OrganizationSettingsPage })));
const BusinessDomainPage       = lazy(() => import('@/features/platform/platformAdmin/BusinessDomainPage').then(m => ({ default: m.BusinessDomainPage })));
const BusinessDomainCreatePage = lazy(() => import('@/features/organization/businessDomain/pages/BusinessDomainCreatePage').then(m => ({ default: m.BusinessDomainCreatePage })));
const BusinessDomainDetailPage = lazy(() => import('@/features/organization/businessDomain/pages/BusinessDomainDetailPage').then(m => ({ default: m.BusinessDomainDetailPage })));
const BusinessDomainEditPage   = lazy(() => import('@/features/organization/businessDomain/pages/BusinessDomainEditPage').then(m => ({ default: m.BusinessDomainEditPage })));
const PermissionsRegistryPage  = lazy(() => import('@/features/iam/rbac/pages/PermissionsRegistryPage').then(m => ({ default: m.PermissionsRegistryPage })));

// ── Business Units — canonical /platform/business-units ────────────────────────────────
const BusinessUnitListPage     = lazy(() => import('@/features/organization/businessUnit/pages/BusinessUnitListPage'));
const BusinessUnitDetailPage   = lazy(() => import('@/features/organization/businessUnit/pages/BusinessUnitDetailPage'));
const BusinessUnitCreatePage   = lazy(() => import('@/features/organization/businessUnit/pages/BusinessUnitCreatePage'));
const BusinessUnitEditPage     = lazy(() => import('@/features/organization/businessUnit/pages/BusinessUnitEditPage'));
const BusinessUnitModulesPage  = lazy(() => import('@/features/organization/buModuleMapping/pages/BusinessUnitModulesPage'));
const BusinessUnitModuleMappingListPage = lazy(() => import('@/features/organization/buModuleMapping/pages/BusinessUnitModuleMappingListPage'));
const BusinessUnitSubscriptionListPage = lazy(() => import('@/features/organization/buSubscription/pages/BusinessUnitSubscriptionListPage'));

// ── User-BU Mapping ───────────────────────────────────────────────────────────
const UserBuMappingListPage    = lazy(() => import('@/features/organization/userBusinessUnit/userBusinessUnitListPage').then(m => ({ default: m.UserBusinessUnitListPage })));
const UserBuMappingDetailPage  = lazy(() => import('@/features/organization/userBusinessUnit/userBusinessUnitDetailPage').then(m => ({ default: m.UserBusinessUnitDetailPage })));
const UserBuMappingMembersPage = lazy(() => import('@/features/organization/userBusinessUnit/BusinessUnitMemberPage').then(m => ({ default: m.BusinessUnitMemberPage })));

// ── Subscriptions ─────────────────────────────────────────────────────────────
const SubscriptionStatusPage = lazy(() => import('@/pages/subscription/SubscriptionStatusPage'));

// ── Platform Admin (super admin only) ─────────────────────────────────────────
const DomainPage          = lazy(() => import('@/features/platform/platformAdmin/DomainPage').then(m => ({ default: m.DomainPage })));
const ModulesPage         = lazy(() => import('@/features/platform/platformAdmin/ModulesPage').then(m => ({ default: m.ModulesPage })));
const ModuleDetailsPage   = lazy(() => import('@/features/platform/platformAdmin/ModuleDetailsPage').then(m => ({ default: m.ModuleDetailsPage })));
const BreakGlassPage      = lazy(() => import('@/features/platform/platformAdmin/BreakGlassPage').then(m => ({ default: m.BreakGlassPage })));
const RoleTemplatesPage   = lazy(() => import('@/features/iam/rbac/pages/RoleTemplatesPage').then(m => ({ default: m.RoleTemplatesPage })));
const TenantAdminPage     = lazy(() => import('@/features/platform/platformAdmin/TenantAdminPage').then(m => ({ default: m.TenantAdminPage })));

// ── Observability (super admin only) ─────────────────────────────────────────
const MetricsPage = lazy(() => import('@/features/observability/MetricsPage').then(m => ({ default: m.MetricsPage })));
const TracesPage  = lazy(() => import('@/features/observability/TracesPage').then(m => ({ default: m.TracesPage })));

// ── Settings ──────────────────────────────────────────────────────────────────
const BrandingPage       = lazy(() => import('@/pages/settings/BrandingPage'));
const APIKeysPage        = lazy(() => import('@/pages/settings/APIKeysPage'));
const FeatureFlagsPage   = lazy(() => import('@/pages/featureFlags/featureFlagsListPage').then(m => ({ default: m.FeatureFlagsListPage })));

// ── Admin ─────────────────────────────────────────────────────────────────────
const AuditListPage    = lazy(() => import('@/pages/audit/auditListPage').then(m => ({ default: m.AuditListPage })));
const ErrorLogListPage = lazy(() => import('@/pages/errorLog/errorLogListPage').then(m => ({ default: m.ErrorLogListPage })));

// ── Operations ────────────────────────────────────────────────────────────────


// ── Support ───────────────────────────────────────────────────────────────────
const PlatformHealthPage     = lazy(() => import('@/features/platform/support/PlatformHealthPage').then(m => ({ default: m.PlatformHealthPage })));
const TenantDiagnosticsPage  = lazy(() => import('@/features/platform/support/TenantDiagnosticsPage').then(m => ({ default: m.TenantDiagnosticsPage })));

// ── Tenant Settings ───────────────────────────────────────────────────────────────────
const TenantSettingsListPage = lazy(() => import('@/features/tenancy/tenantSettings/tenantSettingsListPage').then(m => ({ default: m.TenantSettingsListPage })));

// ── Health Monitor ───────────────────────────────────────────────────────────────────
const HealthListPage = lazy(() => import('@/features/observability/health/healthListPage').then(m => ({ default: m.HealthListPage })));

// ── File Storage ───────────────────────────────────────────────────────────────────
const FileStorageListPage = lazy(() => import('@/features/platform/fileStorage/fileStorageListPage').then(m => ({ default: m.FileStorageListPage })));

// ── User Profile ──────────────────────────────────────────────────────────────
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));

// ── Domain Routers ────────────────────────────────────────────────────────────
const HRMSRouter = lazy(() => import('@/pages/hrms/HRMSRouter'));

// ── PQM ───────────────────────────────────────────────────────────────────────
const ProjectListPage = lazy(() => import('@/features/pqm/pages/project/ProjectListPage').then(m => ({ default: m.ProjectListPage })));
const ProjectCreatePage = lazy(() => import('@/features/pqm/pages/project/ProjectCreatePage').then(m => ({ default: m.ProjectCreatePage })));
const ProjectDetailPage = lazy(() => import('@/features/pqm/pages/project/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ProjectEditPage = lazy(() => import('@/features/pqm/pages/project/ProjectEditPage').then(m => ({ default: m.ProjectEditPage })));
const ProjectTeamPage = lazy(() => import('@/features/pqm/pages/project/ProjectTeamPage'));
const NCManagementPage = lazy(() => import('@/features/pqm/pages/NCManagementPage').then(m => ({ default: m.NCManagementPage })));
const ProjectWorkspaceLayout = lazy(() => import('@/features/pqm/layouts/ProjectWorkspaceLayout').then(m => ({ default: m.ProjectWorkspaceLayout })));
const PQMDashboardPage = lazy(() => import('@/features/pqm/pages/PQMDashboardPage'));
const NCListPage       = lazy(() => import('@/features/pqm/pages/NCListPage'));
const NCDetailPage     = lazy(() => import('@/features/pqm/pages/NCDetailPage'));
const NCCreatePage     = lazy(() => import('@/features/pqm/pages/NCCreatePage'));
const NCEditPage       = lazy(() => import('@/features/pqm/pages/NCEditPage'));
const PQMSettingsPage    = lazy(() => import('@/features/pqm/pages/PQMSettingsPage'));

// ── Error Pages ───────────────────────────────────────────────────────────────
const ModuleNotAvailablePage = lazy(() => import('@/pages/error/ModuleNotAvailablePage'));

// ── 404 ───────────────────────────────────────────────────────────────────────
const NotFoundPage = lazy(() =>
  Promise.resolve({
    default: () => {
      const isPqm = window.location.pathname.startsWith('/pqm');
      const backPath = isPqm ? '/pqm/projects' : '/home';
      const backText = isPqm ? 'Back to PQM' : 'Back to Home';
      return (
        <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-background">
          <h1 className="text-6xl font-extrabold text-foreground">404</h1>
          <p className="text-muted-foreground text-lg">Page not found</p>
          <Link
            to={backPath}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            {backText}
          </Link>
        </div>
      );
    },
  })
);
// ── Legacy Redirect Component ──────────────────────────────────────────────────
const LegacyBusinessUnitRedirect = () => {
  const location = useLocation();
  // Redirect /business-units/... to /platform/business-units/...
  const target = location.pathname.replace(/^\/business-units/, '/platform/business-units');
  return <Navigate to={target} replace />;
};

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── Public Routes ──────────────────────────────────────────────── */}
        <Route path="/"                    element={<WelcomePage />} />
        <Route path="/welcome"             element={<Navigate to="/" replace />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/otp" element={<ForgotPasswordOTPPage />} />
        <Route path="/reset-password"      element={<ResetPasswordPage />} />
        <Route path="/verify-otp"          element={<OTPVerifyPage />} />
        <Route path="/select-business-unit" element={<SelectBusinessUnitPage />} />
        <Route path="/no-business-unit"     element={<NoBusinessUnitPage />} />

        {/* ── Protected Routes inside Shell ──────────────────────────────── */}
        <Route element={<AuthGuard />}>
          <Route element={
            <TenantContextProvider>
              <Suspense fallback={<LoadingScreen />}>
                <PlatformShell />
              </Suspense>
            </TenantContextProvider>
          }>

            {/* Smart Routing Entry Point */}
            <Route path="/home" element={<HomeRouter />} />

            {/* ── Analytics / Dashboard ──────────────────────────────────── */}
            {/* Removed /dashboard root route */}


            {/* ── IAM (Legacy Redirects) ─────────────────────────────────────────────────── */}
            <Route path="/admin/users" element={<Navigate to="/platform/user-management" replace />} />
            <Route path="/iam/user-management" element={<Navigate to="/platform/user-management" replace />} />
            <Route path="/iam/user-management/:userId" element={<Navigate to="/platform/user-management/:userId" replace />} />
            <Route path="/iam/tenancy" element={<Navigate to="/platform/tenancy" replace />} />
            {/* ── Legacy Admin Redirects ─────────────────────────────────────────────────── */}
            <Route path="/admin/roles" element={<Navigate to="/platform/roles" replace />} />
            <Route path="/admin/subscriptions" element={<Navigate to="/platform/subscriptions" replace />} />
            <Route path="/admin/user-bu-mapping" element={<Navigate to="/platform/user-bu-mapping" replace />} />
            <Route path="/admin/user-bu-mapping/bu-members" element={<Navigate to="/platform/user-bu-mapping/bu-members" replace />} />
            <Route path="/admin/user-bu-mapping/:id" element={<Navigate to="/platform/user-bu-mapping/:id" replace />} />
            <Route path="/admin/audit" element={<Navigate to="/platform/audit" replace />} />
            <Route path="/admin/errors" element={<Navigate to="/platform/errors" replace />} />
            <Route path="/admin/tenant-domains" element={<Navigate to="/platform/tenant-domains" replace />} />
            <Route path="/admin/modules" element={<Navigate to="/platform/module-registry" replace />} />
            <Route path="/admin/observability/metrics" element={<Navigate to="/platform/observability/metrics" replace />} />
            <Route path="/admin/observability/traces" element={<Navigate to="/platform/observability/traces" replace />} />

            {/* ── Platform ───────────────────────────────────────────────── */}
            <Route path="/platform" element={<Navigate to="/platform/dashboard" replace />} />
            <Route path="/platform">
              <Route path="dashboard" element={<DashboardPage />} />
              {/* Organizations */}
              <Route path="organizations">
                <Route index element={<Suspense fallback={<LoadingScreen />}><OrganizationListPage /></Suspense>} />
                <Route path="new" element={<Suspense fallback={<LoadingScreen />}><OrganizationCreatePage /></Suspense>} />
                <Route path=":id" element={<Suspense fallback={<LoadingScreen />}><OrganizationDetailPage /></Suspense>} />
                <Route path=":id/edit" element={<Suspense fallback={<LoadingScreen />}><OrganizationEditPage /></Suspense>} />
                <Route path=":id/settings" element={<OrganizationSettingsPage />} />
              </Route>
              {/* Business Domains */}
              <Route path="business-domains">
                <Route index element={<Suspense fallback={<LoadingScreen />}><BusinessDomainPage /></Suspense>} />
                <Route path="new" element={<Suspense fallback={<LoadingScreen />}><BusinessDomainCreatePage /></Suspense>} />
                <Route path=":id" element={<Suspense fallback={<LoadingScreen />}><BusinessDomainDetailPage /></Suspense>} />
                <Route path=":id/edit" element={<Suspense fallback={<LoadingScreen />}><BusinessDomainEditPage /></Suspense>} />
              </Route>
              {/* Users & Tenancy */}
              <Route path="user-management">
                <Route index element={<Suspense fallback={<LoadingScreen />}><UsersPage /></Suspense>} />
                <Route path="create" element={<Suspense fallback={<LoadingScreen />}><UserCreatePage /></Suspense>} />
                <Route path="approvals" element={<Suspense fallback={<LoadingScreen />}><AccessApprovalsPage /></Suspense>} />
                <Route path=":userId" element={<Suspense fallback={<LoadingScreen />}><UserDetailPage /></Suspense>} />
                <Route path=":userId/edit" element={<Suspense fallback={<LoadingScreen />}><UserEditPage /></Suspense>} />
              </Route>
              <Route path="tenancy"         element={<TenancyPage />} />
              <Route path="api-keys"        element={<ApiKeysPage />} />
              {/* Permissions Registry */}
              <Route path="permissions" element={<Suspense fallback={<LoadingScreen />}><PermissionsRegistryPage /></Suspense>} />
              {/* Platform Stats / Admin (super admin) */}
              <Route element={<SuperAdminGuard />}>
                <Route path="tenant-admin" element={<TenantAdminPage />} />
                <Route path="break-glass" element={<BreakGlassPage />} />
                <Route path="audit"  element={<AuditListPage />} />
                <Route path="errors" element={<ErrorLogListPage />} />
                <Route path="tenant-domains"  element={<DomainPage />} />
                <Route path="module-registry">
                  <Route index element={<ModulesPage />} />
                  <Route path=":id" element={<ModuleDetailsPage />} />
                </Route>
              </Route>

              {/* Roles & Subscriptions & User-BU Mapping */}
              <Route path="role-permission-templates/*" element={<Suspense fallback={<LoadingScreen />}><RoleTemplatesPage /></Suspense>} />
              <Route path="roles/*" element={<RolesPage />} />
              <Route path="subscriptions" element={<SubscriptionStatusPage />} />

              {/* BU Special Sections */}
              <Route path="bu-module-mapping">
                <Route index element={<Suspense fallback={<LoadingScreen />}><BusinessUnitModuleMappingListPage /></Suspense>} />
                <Route path=":buId" element={<Suspense fallback={<LoadingScreen />}><BusinessUnitModulesPage /></Suspense>} />
              </Route>
              <Route path="bu-subscriptions"  element={<Suspense fallback={<LoadingScreen />}><BusinessUnitSubscriptionListPage /></Suspense>} />

              <Route path="user-bu-mapping"              element={<UserBuMappingListPage />} />
              <Route path="user-bu-mapping/bu-members"   element={<UserBuMappingMembersPage />} />
              <Route path="user-bu-mapping/:id"          element={<UserBuMappingDetailPage />} />
              {/* Business Units */}
              <Route path="business-units">
                <Route index                      element={<Suspense fallback={<LoadingScreen />}><BusinessUnitListPage /></Suspense>} />
                <Route path="create"              element={<Suspense fallback={<LoadingScreen />}><BusinessUnitCreatePage /></Suspense>} />
                <Route path=":id/edit"            element={<Suspense fallback={<LoadingScreen />}><BusinessUnitEditPage /></Suspense>} />
                <Route path=":id"                 element={<Suspense fallback={<LoadingScreen />}><BusinessUnitDetailPage /></Suspense>} />
                
              </Route>
            </Route>

            {/* ── Business Units — redirect to /platform/business-units ─────────────── */}
            <Route path="/business-units/*" element={<LegacyBusinessUnitRedirect />} />

            {/* ── Observability (super admin only) ───────────────────────── */}
            <Route path="/platform/observability" element={<SuperAdminGuard />}>
              <Route path="metrics" element={<MetricsPage />} />
              <Route path="traces"  element={<TracesPage />} />
            </Route>

            {/* ── Settings ───────────────────────────────────────────────── */}
            <Route path="/settings">
              <Route path="branding"      element={<BrandingPage />} />
              <Route path="integrations"  element={<APIKeysPage />} />
              <Route path="features"      element={<FeatureFlagsPage />} />
            </Route>

            {/* ── Notifications ──────────────────────────────────────────── */}

            {/* ── Support ────────────────────────────────────────────────── */}
            <Route path="/support">
              <Route index               element={<PlatformHealthPage />} />
              <Route path="diagnostics"  element={<TenantDiagnosticsPage />} />
            </Route>

            {/* ── Tenant Settings ───────────────────────────────────────── */}
            <Route path="/platform/tenant-settings" element={<TenantSettingsListPage />} />

            {/* ── Health Monitor ─────────────────────────────────────────── */}
            <Route path="/platform/health" element={<HealthListPage />} />

            {/* ── File Storage ──────────────────────────────────────────── */}
            <Route path="/settings/file-storage" element={<FileStorageListPage />} />

            {/* ── User Profile ───────────────────────────────────────────── */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* ── Operational Domains ──────────────────────────────────────── */}
            <Route element={<DomainGuard domain="hrms" />}>
              <Route element={<ModuleSubscriptionGuard moduleCode="hrms_core" />}>
                <Route path="/hrms/*" element={<HRMSRouter />} />
              </Route>
            </Route>

            {/* ── PQM ───────────────────────────── */}
            <Route element={<BusinessUnitGuard />}>
              <Route path="/pqm" element={<Navigate to="/pqm/projects" replace />} />
              
              {/* Project Configuration / Management */}
              <Route path="/pqm/projects">
                <Route index element={<Suspense fallback={<LoadingScreen />}><ProjectListPage /></Suspense>} />
                <Route path="create" element={<Suspense fallback={<LoadingScreen />}><ProjectCreatePage /></Suspense>} />
                <Route path=":id" element={<Suspense fallback={<LoadingScreen />}><ProjectDetailPage /></Suspense>} />
                <Route path=":id/edit" element={<Suspense fallback={<LoadingScreen />}><ProjectEditPage /></Suspense>} />
              </Route>

              {/* NC Management (Workspaces List) */}
              <Route path="/pqm/nc-management" element={<Suspense fallback={<LoadingScreen />}><NCManagementPage /></Suspense>} />
              
              {/* Redirect legacy generic routes to nc-management */}
              <Route path="/pqm/nc" element={<Navigate to="/pqm/nc-management" replace />} />
              <Route path="/pqm/nc/create" element={<Navigate to="/pqm/nc-management" replace />} />
              <Route path="/pqm/config" element={<Navigate to="/pqm/projects" replace />} />
              
              {/* Project Workspace (Dashboard, NCs, etc) */}
              <Route path="/pqm/nc-management/:projectId" element={<Suspense fallback={<LoadingScreen />}><ProjectWorkspaceLayout /></Suspense>}>
                <Route index element={<PQMDashboardPage />} />
                <Route path="nc" element={<NCListPage />} />
                <Route path="nc/create" element={<NCCreatePage />} />
                <Route path="nc/:id" element={<NCDetailPage />} />
                <Route path="nc/:id/edit" element={<NCEditPage />} />
                <Route path="config" element={<PQMSettingsPage />} />
                <Route path="team" element={<Suspense fallback={<LoadingScreen />}><ProjectTeamPage /></Suspense>} />
              </Route>
            </Route>

          </Route>
        </Route>

        {/* ── Legacy redirects ─────────────────────────────────────────────── */}
        <Route path="/organizations"      element={<Navigate to="/platform/organizations" replace />} />
        <Route path="/organizations/:id"  element={<Navigate to="/platform/organizations/:id" replace />} />

        {/* ── Error / Unauthorized ─────────────────────────────────────────── */}
        <Route
          path="/unauthorized"
          element={
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 800 }}>403</h1>
              <p style={{ color: 'rgba(100,116,139,1)' }}>You do not have permission to access this page.</p>
            </div>
          }
        />

        <Route path="/module-not-available" element={<ModuleNotAvailablePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

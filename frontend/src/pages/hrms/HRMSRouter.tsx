import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PermissionGate } from '@/components/common/PermissionGate';

// ── Pre-existing ────────────────────────────────────────────────────────────
const HRMSPortalPage       = lazy(() => import('./HRMSPortalPage'));
const EmployeeListPage     = lazy(() => import('./EmployeeListPage').then(m => ({ default: m.EmployeeListPage })));
const EmployeeFormPage     = lazy(() => import('./EmployeeFormPage').then(m => ({ default: m.EmployeeFormPage })));
const EmployeeProfilePage  = lazy(() => import('./EmployeeProfilePage').then(m => ({ default: m.EmployeeProfilePage })));
const EmployeeImportHistory= lazy(() => import('./EmployeeImportHistory'));
const AttendancePage            = lazy(() => import('./AttendancePage'));
const LeavePage                 = lazy(() => import('./LeavePage'));
const PayrollPage               = lazy(() => import('./PayrollPage').then(m => ({ default: m.PayrollPage })));

// ── Phase 7 ─────────────────────────────────────────────────────────────────────────────
const LeaveManagementPage       = lazy(() => import('./LeaveManagementPage').then(m => ({ default: m.LeaveManagementPage })));
const AttendanceDashboardPage   = lazy(() => import('./AttendanceDashboardPage').then(m => ({ default: m.AttendanceDashboardPage })));
const Employee360Page           = lazy(() => import('./Employee360Page').then(m => ({ default: m.Employee360Page })));
const TrainingPage              = lazy(() => import('./TrainingPage').then(m => ({ default: m.TrainingPage })));
// ── Phase 7: ESS + MSS ─────────────────────────────────────────────────────────────
const ESSMyAttendancePage       = lazy(() => import('./ESSMyAttendancePage').then(m => ({ default: m.ESSMyAttendancePage })));
const ESSMyLeavePage            = lazy(() => import('./ESSMyLeavePage').then(m => ({ default: m.ESSMyLeavePage })));
const ESSMyPayslipsPage         = lazy(() => import('./ESSMyPayslipsPage').then(m => ({ default: m.ESSMyPayslipsPage })));
const MSSLeavePage              = lazy(() => import('./MSSLeavePage').then(m => ({ default: m.MSSLeavePage })));
const MSSAttendancePage         = lazy(() => import('./MSSAttendancePage').then(m => ({ default: m.MSSAttendancePage })));

// ── Phase 8 ─────────────────────────────────────────────────────────────────
const JobPostingsPage           = lazy(() => import('./JobPostingsPage').then(m => ({ default: m.JobPostingsPage })));
const CandidatePipelinePage     = lazy(() => import('./CandidatePipelinePage').then(m => ({ default: m.CandidatePipelinePage })));
const InterviewSchedulerPage    = lazy(() => import('./InterviewSchedulerPage').then(m => ({ default: m.InterviewSchedulerPage })));
const AppraisalCyclePage        = lazy(() => import('./AppraisalCyclePage').then(m => ({ default: m.AppraisalCyclePage })));
const MyAppraisalPage           = lazy(() => import('./MyAppraisalPage').then(m => ({ default: m.MyAppraisalPage })));
const TeamAppraisalPage         = lazy(() => import('./TeamAppraisalPage').then(m => ({ default: m.TeamAppraisalPage })));

// ── Phase 9 ─────────────────────────────────────────────────────────────────
const HRAnalyticsPage           = lazy(() => import('./HRAnalyticsPage'));
const PayrollAnalyticsPage      = lazy(() => import('./PayrollAnalyticsPage'));
const AttendanceAnalyticsPage   = lazy(() => import('./AttendanceAnalyticsPage'));
const LeaveAnalyticsPage        = lazy(() => import('./LeaveAnalyticsPage'));

// ── Phase 6 ─────────────────────────────────────────────────────────────────
const DepartmentManagementPage  = lazy(() => import('./DepartmentManagementPage').then(m => ({ default: m.DepartmentManagementPage })));
const DesignationManagementPage = lazy(() => import('./DesignationManagementPage').then(m => ({ default: m.DesignationManagementPage })));
const ShiftManagementPage       = lazy(() => import('./ShiftManagementPage').then(m => ({ default: m.ShiftManagementPage })));
const AssetManagementPage       = lazy(() => import('./AssetManagementPage').then(m => ({ default: m.AssetManagementPage })));
const OrgChartPage              = lazy(() => import('./OrgChartPage').then(m => ({ default: m.OrgChartPage })));
const OnboardingPage            = lazy(() => import('./OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const OffboardingPage           = lazy(() => import('./OffboardingPage').then(m => ({ default: m.OffboardingPage })));

const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
  </div>
);

const S = (C: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<Spinner />}><C /></Suspense>
);

export default function HRMSRouter() {
  return (
    <Routes>
      {/* ── Core ── */}
      <Route path="/"                  element={S(HRMSPortalPage)} />
      {/* ── Employee: Create, Profile, Edit ── */}
      <Route path="employees/new"              element={
        <PermissionGate permission="hrms.employees.create" fallback={<div className="p-8 text-center text-gray-500">No permission.</div>}>
          {S(EmployeeFormPage)}
        </PermissionGate>
      } />
      <Route path="employees/:id/edit"         element={
        <PermissionGate permission="hrms.employees.edit" fallback={<div className="p-8 text-center text-gray-500">No permission.</div>}>
          {S(EmployeeFormPage)}
        </PermissionGate>
      } />
      <Route path="employees/:id"              element={
        <PermissionGate permission="hrms.employees.view" fallback={<div className="p-8 text-center text-gray-500">No permission.</div>}>
          {S(EmployeeProfilePage)}
        </PermissionGate>
      } />
      {/* ── Employee List ── */}
      <Route path="employees"              element={
        <PermissionGate permission="hrms.employees.view" fallback={<div className="p-8 text-center text-gray-500">No permission.</div>}>
          {S(EmployeeListPage)}
        </PermissionGate>
      } />
      <Route path="employees/import-history" element={
        <PermissionGate permission="hrms.employees.create" fallback={<div className="p-8 text-center text-gray-500">No permission.</div>}>
          {S(EmployeeImportHistory)}
        </PermissionGate>
      } />

      {/* ── Existing modules ── */}
      <Route path="attendance/*"       element={S(AttendancePage)} />
      <Route path="leave/*"            element={S(LeavePage)} />
      {/* ── Payroll: root + all sub-routes → PayrollPage (URL-aware tabs) ── */}
      <Route path="payroll"                      element={S(PayrollPage)} />
      <Route path="payroll/structures"            element={S(PayrollPage)} />
      <Route path="payroll/payslips"              element={S(PayrollPage)} />
      <Route path="payroll/it-declarations"       element={S(PayrollPage)} />
      <Route path="payroll/reports"               element={S(PayrollPage)} />
      <Route path="payroll/compliance"            element={S(PayrollPage)} />
      {/* Catch remaining payroll sub-paths */}
      <Route path="payroll/*"                     element={S(PayrollPage)} />

      {/* ── Phase 7: Legacy admin views ── */}
      <Route path="leave-management"      element={S(LeaveManagementPage)} />
      <Route path="attendance-dashboard"  element={S(AttendanceDashboardPage)} />
      <Route path="employee-360"          element={S(Employee360Page)} />
      <Route path="training"              element={S(TrainingPage)} />

      {/* ── Phase 7: ESS (Employee Self-Service) ── */}
      <Route path="ess/attendance"        element={S(ESSMyAttendancePage)} />
      <Route path="ess/leave"             element={S(ESSMyLeavePage)} />
      <Route path="ess/payslips"          element={S(ESSMyPayslipsPage)} />

      {/* ── Phase 7: MSS (Manager Self-Service) ── */}
      <Route path="mss/leave"             element={
        <PermissionGate permission="hrms.leave.approve" fallback={<div className="p-8 text-center text-gray-500">No permission to approve leave.</div>}>
          {S(MSSLeavePage)}
        </PermissionGate>
      } />
      <Route path="mss/attendance"        element={
        <PermissionGate permission="hrms.attendance.view_team" fallback={<div className="p-8 text-center text-gray-500">No permission to view team attendance.</div>}>
          {S(MSSAttendancePage)}
        </PermissionGate>
      } />


      {/* ── Phase 8 ── */}
      <Route path="job-postings"          element={S(JobPostingsPage)} />
      <Route path="candidates"            element={S(CandidatePipelinePage)} />
      <Route path="interviews"            element={S(InterviewSchedulerPage)} />
      <Route path="appraisal-cycles"      element={S(AppraisalCyclePage)} />
      <Route path="my-appraisal"          element={S(MyAppraisalPage)} />
      <Route path="team-appraisal"        element={S(TeamAppraisalPage)} />

      {/* ── Phase 9 ── */}
      <Route path="analytics/hr"          element={S(HRAnalyticsPage)} />
      <Route path="analytics/payroll"     element={S(PayrollAnalyticsPage)} />
      <Route path="analytics/attendance"  element={S(AttendanceAnalyticsPage)} />
      <Route path="analytics/leave"       element={S(LeaveAnalyticsPage)} />

      {/* ── Phase 6 ── */}
      <Route path="departments"        element={S(DepartmentManagementPage)} />
      <Route path="designations"       element={S(DesignationManagementPage)} />
      <Route path="shifts"             element={S(ShiftManagementPage)} />
      <Route path="assets"             element={S(AssetManagementPage)} />
      <Route path="org-chart"          element={S(OrgChartPage)} />
      <Route path="onboarding"         element={S(OnboardingPage)} />
      <Route path="offboarding"        element={S(OffboardingPage)} />
    </Routes>
  );
}

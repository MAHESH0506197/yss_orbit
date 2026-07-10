// yss_orbit/frontend/src/pages/hrms/EmployeeProfilePage.tsx
/**
 * EmployeeProfilePage — Full-page Employee Profile view.
 * 
 * Route: /hrms/employees/:id
 * 
 * Shows comprehensive employee details across 5 tabs:
 *   Personal | Professional | Documents | Bank | History (360 Timeline)
 * 
 * Renders EmployeeDetailsDrawer content inline (always-open) in a full-page layout
 * plus an embedded Employee 360 timeline tab.
 */
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, Phone, CreditCard, FileText,
  Clock, Edit3, Building, Calendar, Shield,
} from 'lucide-react';
import { useEmployee } from '@/features/hrms/api/useEmployees';

import { EmployeeFormDialog } from '@/features/hrms/components/employees/EmployeeFormDialog';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Employee } from '@/features/hrms/types/employeeTypes';
import { formatIST } from '@/utils/date';

// ── Tab types ──────────────────────────────────────────────────────────────────
type Tab = 'personal' | 'professional' | 'documents' | 'bank' | 'history';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'personal',      label: 'Personal',      icon: <User size={14} /> },
  { id: 'professional',  label: 'Professional',   icon: <Briefcase size={14} /> },
  { id: 'documents',     label: 'Documents',      icon: <FileText size={14} /> },
  { id: 'bank',          label: 'Bank & Tax',     icon: <CreditCard size={14} /> },
  { id: 'history',       label: 'History',        icon: <Clock size={14} /> },
];

// ── Field display helpers ──────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-500 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</span>
      <span className="text-sm font-500 text-[hsl(var(--foreground))]">{value || '—'}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-3)/0.5)] flex items-center gap-2">
        <span className="text-[hsl(var(--primary))]">{icon}</span>
        <p className="text-sm font-700 text-[hsl(var(--foreground))]">{title}</p>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: employee, isLoading } = useEmployee(id || '', { enabled: !!id });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))] animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading employee profile…</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center space-y-2">
          <p className="text-lg font-700 text-[hsl(var(--foreground))]">Employee not found</p>
          <button
            onClick={() => navigate('/hrms/employees')}
            className="text-sm text-[hsl(var(--primary))] hover:underline"
          >
            Return to employee list
          </button>
        </div>
      </div>
    );
  }

  const statusColor = {
    ACTIVE: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]',
    ON_LEAVE: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]',
    TERMINATED: 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]',
    RESIGNED: 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]',
    NOTICE_PERIOD: 'bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.3)]',
  }[employee.employment_status] || 'bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-12">
      {/* ── Page Header ── */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft size={16} />
            Employees
          </button>
          <div className="h-5 w-px bg-[hsl(var(--border))]" />
          <span className="text-sm text-[hsl(var(--primary))] font-500">
            {employee.first_name} {employee.last_name}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 mt-6">
        {/* ── Employee Identity Card ── */}
        <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Avatar */}
          {employee.photo_url ? (
            <img
              src={employee.photo_url}
              alt={`${employee.first_name} profile`}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[hsl(var(--border))] shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-2xl font-800 text-white shrink-0">
              {employee.first_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-800 text-[hsl(var(--foreground))]">
                {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}{employee.last_name}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-700 border ${statusColor}`}>
                {employee.employment_status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm font-600 text-[hsl(var(--primary))]">
              {employee.designation_name || 'No Designation'} · {employee.department_name || 'No Department'}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1">
                <Briefcase size={11} />
                <span className="font-mono">{employee.employee_code || 'No Code'}</span>
              </span>
              {employee.work_email && (
                <span className="flex items-center gap-1">
                  <span>✉</span> {employee.work_email}
                </span>
              )}
              {employee.date_of_joining && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Joined {formatIST(employee.date_of_joining, 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Action: Edit */}
          <PermissionGate permission="hrms.employees.edit">
            <button
              onClick={() => setIsEditOpen(true)}
              id="employee-profile-edit-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-600 hover:opacity-90 transition-opacity shrink-0"
            >
              <Edit3 size={14} />
              Edit Profile
            </button>
          </PermissionGate>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 p-1 bg-[hsl(var(--background-3))] rounded-xl border border-[hsl(var(--border))] w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`employee-profile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}

        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard title="Personal Information" icon={<User size={14} />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Gender" value={employee.gender === 'M' ? 'Male' : employee.gender === 'F' ? 'Female' : employee.gender} />
                <InfoRow label="Date of Birth" value={employee.date_of_birth ? formatIST(employee.date_of_birth, 'MMM d, yyyy') : undefined} />
                <InfoRow label="Marital Status" value={employee.marital_status} />
                <InfoRow label="Blood Group" value={employee.blood_group} />
                <InfoRow label="Nationality" value={(employee as any).nationality || 'Indian'} />
              </div>
            </SectionCard>
            <SectionCard title="Contact Details" icon={<Phone size={14} />}>
              <div className="space-y-3">
                <InfoRow label="Official Email" value={employee.work_email} />
                <InfoRow label="Personal Email" value={employee.personal_email} />
                <InfoRow label="Mobile" value={employee.phone} />
                <InfoRow label="Emergency Contact" value={employee.emergency_contact_name} />
                <InfoRow label="Emergency Phone" value={employee.emergency_contact_phone} />
              </div>
            </SectionCard>
            <div className="md:col-span-2">
              <SectionCard title="Address" icon={<Building size={14} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Current Address" value={employee.current_address} />
                  <InfoRow label="Permanent Address" value={employee.permanent_address} />
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard title="Employment Details" icon={<Briefcase size={14} />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Employee Code" value={employee.employee_code} />
                <InfoRow label="Employment Type" value={employee.employment_type?.replace('_', ' ')} />
                <InfoRow label="Status" value={employee.employment_status?.replace('_', ' ')} />
                <InfoRow label="Date of Joining" value={employee.date_of_joining ? formatIST(employee.date_of_joining, 'MMM d, yyyy') : undefined} />
                <InfoRow label="Probation End" value={employee.probation_end_date ? formatIST(employee.probation_end_date, 'MMM d, yyyy') : undefined} />
                <InfoRow label="Confirmation" value={employee.confirmation_date ? formatIST(employee.confirmation_date, 'MMM d, yyyy') : undefined} />
              </div>
            </SectionCard>
            <SectionCard title="Organisation" icon={<Building size={14} />}>
              <div className="space-y-3">
                <InfoRow label="Department" value={employee.department_name} />
                <InfoRow label="Designation" value={employee.designation_name} />
                <InfoRow label="Annual CTC" value={employee.ctc ? `₹${Number(employee.ctc).toLocaleString('en-IN')}` : undefined} />
                <InfoRow label="Basic Salary" value={employee.basic_salary ? `₹${Number(employee.basic_salary).toLocaleString('en-IN')}/month` : undefined} />
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'documents' && (
          <SectionCard title="Statutory Documents" icon={<Shield size={14} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoRow label="PAN Number" value={employee.pan_number} />
              <InfoRow label="Aadhaar Number" value={employee.aadhaar_number} />
              <InfoRow label="Passport Number" value={employee.passport_number} />
              <InfoRow label="PF Number" value={employee.pf_number} />
              <InfoRow label="ESI Number" value={employee.esi_number} />
            </div>
          </SectionCard>
        )}

        {activeTab === 'bank' && (
          <SectionCard title="Banking Information" icon={<CreditCard size={14} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoRow label="Bank Name" value={employee.bank_name} />
              <InfoRow
                label="Account Number"
                value={employee.bank_account_number ? '••••' + employee.bank_account_number.slice(-4) : undefined}
              />
              <InfoRow label="IFSC Code" value={employee.bank_ifsc} />
            </div>
            <div className="mt-4 p-3 rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.3)]">
              <p className="text-xs text-[hsl(var(--warning))] font-500">
                🔒 Banking details are encrypted. Only the last 4 digits of the account number are visible.
              </p>
            </div>
          </SectionCard>
        )}

        {activeTab === 'history' && (
          <SectionCard title="Career Timeline (360 View)" icon={<Clock size={14} />}>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Full career history — promotions, transfers, leaves, and lifecycle events.
            </p>
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
              <Clock size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">For complete 360 timeline, visit the Employee 360 view.</p>
              <button
                onClick={() => navigate(`/hrms/employees/${id}/360`)}
                className="mt-3 text-sm text-[hsl(var(--primary))] hover:underline"
              >
                Open Employee 360 →
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <EmployeeFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        employee={employee as unknown as Employee}
      />
    </div>
  );
};

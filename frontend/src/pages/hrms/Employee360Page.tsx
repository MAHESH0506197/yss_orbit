// yss_orbit\frontend\src\pages\hrms\Employee360Page.tsx
import React, { useState } from 'react';
import {
  User, Briefcase, Calendar, Clock, Award, BookOpen,
  Target, TrendingUp, Building2, FileText, Bell, CreditCard,
  ChevronDown, ChevronUp, MapPin, Phone, Mail, Globe,
  CheckCircle, XCircle, AlertCircle, ArrowRight, Download,
  Star, Activity, Shield, Users,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey =
  | 'profile' | 'employment' | 'payroll' | 'attendance'
  | 'leave' | 'assets' | 'training' | 'performance'
  | 'timeline' | 'documents' | 'emergency' | 'notifications';

interface Employee360 {
  id: string;
  name: string;
  empCode: string;
  avatar: string;
  designation: string;
  department: string;
  reportingTo: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  probationEnd: string;
  employmentType: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'PROBATION';
  ctc: string;
  grade: string;
}

// ─── Mock Employee Data ───────────────────────────────────────────────────────

const EMPLOYEES: Employee360[] = [
  { id: 'e1', name: 'Arjun Kumar',  empCode: 'EMP001', avatar: 'AK', designation: 'Senior Engineer',     department: 'Engineering', reportingTo: 'Vikram Das',   email: 'arjun.kumar@yss.in',  phone: '+91 98765 43210', location: 'Bengaluru', joinDate: '2023-04-15', probationEnd: '2023-10-14', employmentType: 'Full-Time', status: 'ACTIVE',    ctc: '₹18,00,000', grade: 'L4' },
  { id: 'e2', name: 'Priya Sharma', empCode: 'EMP002', avatar: 'PS', designation: 'Product Manager',      department: 'Product',     reportingTo: 'Sneha Kapoor', email: 'priya.sharma@yss.in', phone: '+91 87654 32109', location: 'Bengaluru', joinDate: '2024-01-10', probationEnd: '2024-07-09', employmentType: 'Full-Time', status: 'ACTIVE',    ctc: '₹22,00,000', grade: 'M1' },
  { id: 'e3', name: 'Rohan Mehta',  empCode: 'EMP003', avatar: 'RM', designation: 'UI/UX Designer',       department: 'Design',      reportingTo: 'Ananya Singh', email: 'rohan.mehta@yss.in',  phone: '+91 76543 21098', location: 'Pune',      joinDate: '2024-06-01', probationEnd: '2024-12-01', employmentType: 'Full-Time', status: 'PROBATION', ctc: '₹12,00,000', grade: 'L2' },
];

const SELECTED_EMP = EMPLOYEES[0]!;

// ─── Tab Icon Map ─────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'profile',       label: 'Profile',        icon: <User size={14} /> },
  { key: 'employment',    label: 'Employment',     icon: <Briefcase size={14} /> },
  { key: 'payroll',       label: 'Payroll',        icon: <CreditCard size={14} /> },
  { key: 'attendance',    label: 'Attendance',     icon: <Clock size={14} /> },
  { key: 'leave',         label: 'Leave',          icon: <Calendar size={14} /> },
  { key: 'assets',        label: 'Assets',         icon: <Shield size={14} /> },
  { key: 'training',      label: 'Training',       icon: <BookOpen size={14} /> },
  { key: 'performance',   label: 'Performance',    icon: <Target size={14} /> },
  { key: 'timeline',      label: 'Timeline',       icon: <Activity size={14} /> },
  { key: 'documents',     label: 'Documents',      icon: <FileText size={14} /> },
  { key: 'emergency',     label: 'Emergency',      icon: <Bell size={14} /> },
  { key: 'notifications', label: 'Notifications',  icon: <Bell size={14} /> },
];

// ─── Profile Tab ──────────────────────────────────────────────────────────────

const ProfileTab: React.FC<{ emp: Employee360 }> = ({ emp }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Personal Information</h4>
        <div className="space-y-3">
          {[
            { icon: <User size={13} />,     label: 'Full Name',   value: emp.name },
            { icon: <Mail size={13} />,     label: 'Email',       value: emp.email },
            { icon: <Phone size={13} />,    label: 'Phone',       value: emp.phone },
            { icon: <MapPin size={13} />,   label: 'Location',    value: emp.location },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] shrink-0">{f.icon}</div>
              <div>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{f.label}</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Bank & Tax Details</h4>
        <div className="space-y-3">
          {[
            { label: 'PAN',          value: 'ABCPK1234L' },
            { label: 'Bank Account', value: '•••• •••• 4521' },
            { label: 'IFSC Code',    value: 'HDFC0001234' },
            { label: 'UAN',          value: '100123456789' },
            { label: 'ESIC No.',     value: '3100123456789' },
          ].map(f => (
            <div key={f.label} className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">{f.label}</span>
              <span className="font-medium text-[hsl(var(--foreground))] font-mono">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Employment Tab ───────────────────────────────────────────────────────────

const EmploymentTab: React.FC<{ emp: Employee360 }> = ({ emp }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
        <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Job Details</h4>
        <div className="space-y-3">
          {[
            { label: 'Designation',       value: emp.designation },
            { label: 'Department',        value: emp.department },
            { label: 'Reporting To',      value: emp.reportingTo },
            { label: 'Grade',             value: emp.grade },
            { label: 'Employment Type',   value: emp.employmentType },
            { label: 'Date of Joining',   value: emp.joinDate },
            { label: 'Probation End',     value: emp.probationEnd },
          ].map(f => (
            <div key={f.label} className="flex justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">{f.label}</span>
              <span className="font-medium text-[hsl(var(--foreground))]">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
          <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Career History</h4>
          {[
            { role: 'Senior Engineer', dept: 'Engineering', period: 'Apr 2024 – Present' },
            { role: 'Engineer II',     dept: 'Engineering', period: 'Apr 2023 – Mar 2024' },
          ].map((h, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{h.role}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{h.dept} · {h.period}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Payroll Tab ──────────────────────────────────────────────────────────────

const PayrollTab: React.FC<{ emp: Employee360 }> = ({ emp }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4 mb-2">
      {[
        { label: 'Annual CTC', value: emp.ctc, color: 'var(--primary)' },
        { label: 'Gross Monthly', value: '₹1,50,000', color: 'var(--teal)' },
        { label: 'Net Take-Home', value: '₹1,22,400', color: 'var(--success)' },
      ].map(s => (
        <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center">
          <p className="text-xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Salary Breakdown — Jun 2026</h4>
      <div className="space-y-2">
        {[
          { label: 'Basic Salary', value: '₹75,000', type: 'earning' },
          { label: 'HRA', value: '₹30,000', type: 'earning' },
          { label: 'Transport Allowance', value: '₹3,200', type: 'earning' },
          { label: 'Special Allowance', value: '₹41,800', type: 'earning' },
          { label: 'PF (Employee 12%)', value: '−₹9,000', type: 'deduction' },
          { label: 'TDS', value: '−₹10,500', type: 'deduction' },
          { label: 'Professional Tax', value: '−₹200', type: 'deduction' },
        ].map(r => (
          <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-[hsl(var(--border))] last:border-0">
            <span className="text-[hsl(var(--muted-foreground))]">{r.label}</span>
            <span className={`font-semibold ${r.type === 'earning' ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}`}>{r.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold pt-2">
          <span className="text-[hsl(var(--foreground))]">Net Pay</span>
          <span className="text-[hsl(var(--teal))]">₹1,30,100</span>
        </div>
      </div>
    </div>
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Recent Payslips</h4>
      <div className="space-y-2">
        {['Jun 2026','May 2026','Apr 2026'].map(month => (
          <div key={month} className="flex items-center justify-between p-2.5 rounded-lg bg-[hsl(var(--muted)/0.4)] hover:bg-[hsl(var(--muted)/0.7)] transition-colors group">
            <span className="text-sm text-[hsl(var(--foreground))]">{month}</span>
            <button className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] opacity-0 group-hover:opacity-100 transition-opacity">
              <Download size={11} />Download
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Attendance Tab ───────────────────────────────────────────────────────────

const AttendanceTab: React.FC = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Present Days',  value: 20, color: 'var(--success)' },
        { label: 'Absent Days',   value: 0,  color: 'var(--destructive)' },
        { label: 'Late Entries',  value: 2,  color: 'var(--accent)' },
        { label: 'Attendance %',  value: '95%', color: 'var(--teal)' },
      ].map(s => (
        <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center shadow-sm">
          <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Recent Log</h4>
      <div className="space-y-2">
        {[
          { date: '2026-06-11', checkIn: '09:02', checkOut: '—', hrs: '—', status: 'In Office' },
          { date: '2026-06-10', checkIn: '08:58', checkOut: '18:05', hrs: '9h 07m', status: 'Present' },
          { date: '2026-06-09', checkIn: '09:22', checkOut: '18:00', hrs: '8h 38m', status: 'Late (22m)' },
          { date: '2026-06-08', checkIn: '—',     checkOut: '—',     hrs: '—',     status: 'Sunday' },
          { date: '2026-06-07', checkIn: '08:50', checkOut: '17:55', hrs: '9h 05m', status: 'Present' },
        ].map(r => (
          <div key={r.date} className="grid grid-cols-4 gap-2 text-xs py-1.5 border-b border-[hsl(var(--border))] last:border-0">
            <span className="text-[hsl(var(--muted-foreground))] font-mono">{r.date}</span>
            <span className="text-[hsl(var(--foreground))]">{r.checkIn} → {r.checkOut}</span>
            <span className="text-[hsl(var(--teal))] font-medium">{r.hrs}</span>
            <span className={`font-medium ${r.status.includes('Late') ? 'text-[hsl(var(--accent))]' : r.status === 'Sunday' ? 'text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--success))]'}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Leave Tab ────────────────────────────────────────────────────────────────

const LeaveTab: React.FC = () => (
  <div className="space-y-5">
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Leave Balances</h4>
      <div className="space-y-3">
        {[
          { name: 'Annual Leave', entitled: 21, used: 7, pending: 2, color: 'hsl(var(--primary))' },
          { name: 'Sick Leave',   entitled: 12, used: 3, pending: 0, color: 'hsl(var(--destructive))' },
          { name: 'Casual Leave', entitled: 12, used: 5, pending: 0, color: 'hsl(var(--accent))' },
          { name: 'Comp Off',     entitled: 4,  used: 1, pending: 1, color: 'hsl(var(--teal))' },
        ].map(lt => {
          const available = lt.entitled - lt.used - lt.pending;
          const pct = ((lt.used + lt.pending) / lt.entitled) * 100;
          return (
            <div key={lt.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[hsl(var(--foreground))]">{lt.name}</span>
                <span className="text-[hsl(var(--muted-foreground))] text-xs">{available} / {lt.entitled} available</span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: lt.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Assets Tab ───────────────────────────────────────────────────────────────

const AssetsTab: React.FC = () => (
  <div className="space-y-5">
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Assigned Assets</h4>
      <div className="space-y-3">
        {[
          { asset: 'MacBook Pro 16"',    code: 'ASGN-0041', type: 'Laptop',  assignedOn: '2023-04-20', status: 'ASSIGNED' },
          { asset: 'Dell 27" Monitor',   code: 'ASGN-0089', type: 'Monitor', assignedOn: '2023-04-20', status: 'ASSIGNED' },
          { asset: 'iPhone 14 Pro',      code: 'ASGN-0122', type: 'Mobile',  assignedOn: '2024-01-10', status: 'ASSIGNED' },
        ].map(a => (
          <div key={a.code} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))]">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{a.asset}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{a.type} · {a.code} · Assigned {a.assignedOn}</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">✓ {a.status}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Training Tab ─────────────────────────────────────────────────────────────

const TrainingTab: React.FC = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Completed', value: 4, color: 'var(--success)' },
        { label: 'In Progress', value: 1, color: 'var(--primary)' },
        { label: 'Mandatory Pending', value: 1, color: 'var(--destructive)' },
      ].map(s => (
        <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Training History</h4>
      <div className="space-y-3">
        {[
          { course: 'React Advanced Patterns', provider: 'Internal', completedOn: '2026-03-15', score: 88, status: 'PASSED', mandatory: false },
          { course: 'AWS Cloud Practitioner',  provider: 'AWS',      completedOn: '2026-01-20', score: 92, status: 'PASSED', mandatory: true },
          { course: 'POSH Awareness Training', provider: 'HR Dept',  completedOn: '2025-11-05', score: 100, status: 'PASSED', mandatory: true },
          { course: 'Docker & Kubernetes',     provider: 'External', completedOn: '—',          score: null, status: 'IN_PROGRESS', mandatory: false },
          { course: 'Information Security 2026', provider: 'IT Dept',completedOn: '—',          score: null, status: 'NOT_STARTED', mandatory: true },
        ].map(t => (
          <div key={t.course} className="flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{t.course}</p>
                {t.mandatory && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] font-semibold">Mandatory</span>}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t.provider} · {t.completedOn}</p>
            </div>
            <div className="text-right">
              {t.score != null && <p className="text-sm font-bold text-[hsl(var(--success))]">{t.score}%</p>}
              <span className={`text-xs font-medium ${t.status === 'PASSED' ? 'text-[hsl(var(--success))]' : t.status === 'IN_PROGRESS' ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{t.status.replace('_', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Performance Tab ──────────────────────────────────────────────────────────

const PerformanceTab: React.FC = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Last Rating', value: '4.2 / 5', color: 'var(--warning)', sub: 'FY 2025-26' },
        { label: 'Current Goals', value: '5 Active', color: 'var(--primary)', sub: 'Q1 FY 2026-27' },
        { label: 'Completed Goals', value: '12', color: 'var(--success)', sub: 'All time' },
      ].map(s => (
        <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center">
          <p className="text-xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.sub}</p>
        </div>
      ))}
    </div>
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Q1 2026-27 Goals</h4>
      <div className="space-y-3">
        {[
          { goal: 'Complete microservices refactor',     progress: 75, dueDate: '2026-06-30' },
          { goal: 'Mentor 2 junior engineers',           progress: 50, dueDate: '2026-07-15' },
          { goal: 'Achieve AWS Solutions Architect cert',progress: 30, dueDate: '2026-08-31' },
          { goal: 'Reduce API response time by 20%',    progress: 90, dueDate: '2026-06-15' },
          { goal: 'Write 5 technical blog posts',        progress: 60, dueDate: '2026-09-30' },
        ].map(g => (
          <div key={g.goal}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[hsl(var(--foreground))]">{g.goal}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{g.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div className="h-2 rounded-full bg-[hsl(var(--primary))] transition-all duration-500" style={{ width: `${g.progress}%` }} />
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Due: {g.dueDate}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

const TimelineTab: React.FC = () => {
  const events = [
    { date: '2026-06-01', type: 'LEAVE',     title: 'Annual Leave Approved', detail: '2 days — Jun 16-17', color: 'hsl(var(--primary))' },
    { date: '2026-05-01', type: 'SALARY',    title: 'Salary Revision',       detail: '+₹2,00,000 CTC — effective May 2026', color: 'hsl(var(--success))' },
    { date: '2026-04-01', type: 'PROMOTION', title: 'Promoted to Senior Engineer', detail: 'Grade L3 → L4', color: 'hsl(var(--warning))' },
    { date: '2026-01-15', type: 'TRAINING',  title: 'Completed AWS Training', detail: 'Score: 92% — Certified', color: 'hsl(var(--teal))' },
    { date: '2025-10-14', type: 'CONFIRM',   title: 'Confirmed as Permanent Employee', detail: 'Probation period ended', color: 'hsl(var(--accent))' },
    { date: '2023-04-15', type: 'JOIN',      title: 'Joined as Engineer II', detail: 'Engineering Department', color: 'hsl(var(--muted-foreground))' },
  ];
  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
      <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-5">Career Timeline</h4>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-[hsl(var(--border))]" />
        <div className="space-y-5">
          {events.map((ev, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10" style={{ background: 'hsl(var(--card))', borderColor: ev.color }}>
                <div className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
              </div>
              <div className="flex-1 bg-[hsl(var(--muted)/0.4)] rounded-xl p-3 border border-[hsl(var(--border))]">
                <div className="flex justify-between mb-0.5">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{ev.title}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{ev.date}</p>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{ev.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Documents Tab ────────────────────────────────────────────────────────────

const DocumentsTab: React.FC = () => (
  <div className="space-y-3">
    {[
      { name: 'Offer Letter',            type: 'PDF', size: '320 KB', uploadedOn: '2023-04-15', status: 'VERIFIED' },
      { name: 'Employment Agreement',    type: 'PDF', size: '240 KB', uploadedOn: '2023-04-15', status: 'VERIFIED' },
      { name: 'PAN Card',                type: 'JPG', size: '180 KB', uploadedOn: '2023-04-16', status: 'VERIFIED' },
      { name: 'Aadhar Card',             type: 'PDF', size: '350 KB', uploadedOn: '2023-04-16', status: 'VERIFIED' },
      { name: 'Education Certificate',   type: 'PDF', size: '420 KB', uploadedOn: '2023-04-18', status: 'VERIFIED' },
      { name: 'Background Check Report', type: 'PDF', size: '820 KB', uploadedOn: '2023-05-02', status: 'VERIFIED' },
    ].map(doc => (
      <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))]">{doc.type}</div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{doc.name}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{doc.size} · Uploaded {doc.uploadedOn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[hsl(var(--success))]">✓ {doc.status}</span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><Download size={13} /></button>
        </div>
      </div>
    ))}
  </div>
);

// ─── Emergency Tab ────────────────────────────────────────────────────────────

const EmergencyTab: React.FC = () => (
  <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5">
    <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Emergency Contacts</h4>
    <div className="space-y-4">
      {[
        { name: 'Geeta Kumar', relation: 'Spouse', phone: '+91 98124 56789', email: 'geeta.kumar@email.com' },
        { name: 'Rajesh Kumar', relation: 'Father', phone: '+91 87456 12345', email: '—' },
      ].map(c => (
        <div key={c.name} className="p-4 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))]">
          <div className="flex justify-between mb-2">
            <p className="font-semibold text-[hsl(var(--foreground))]">{c.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium">{c.relation}</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]"><Phone size={11} className="inline mr-1" />{c.phone}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]"><Mail size={11} className="inline mr-1" />{c.email}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Notifications Tab ────────────────────────────────────────────────────────

const NotificationsTab: React.FC = () => (
  <div className="space-y-3">
    {[
      { title: 'Leave approved', detail: 'Annual Leave for Jun 16-17 approved by Vikram Das', time: '2h ago', read: false, color: 'hsl(var(--success))' },
      { title: 'Payslip available', detail: 'Your May 2026 payslip is ready to download', time: '2d ago', read: false, color: 'hsl(var(--primary))' },
      { title: 'IT Declaration deadline', detail: 'Submit IT declarations before Jun 30, 2026', time: '3d ago', read: true, color: 'hsl(var(--warning))' },
      { title: 'Training assigned', detail: 'Information Security 2026 (mandatory) assigned to you', time: '5d ago', read: true, color: 'hsl(var(--accent))' },
    ].map((n, i) => (
      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${n.read ? 'bg-[hsl(var(--card))] border-[hsl(var(--border))]' : 'bg-[hsl(var(--primary)/0.04)] border-[hsl(var(--primary)/0.2)]'}`}>
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.color }} />
        <div className="flex-1">
          <p className={`text-sm ${n.read ? 'text-[hsl(var(--muted-foreground))]' : 'font-semibold text-[hsl(var(--foreground))]'}`}>{n.title}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{n.detail}</p>
        </div>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5">{n.time}</span>
      </div>
    ))}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Employee360Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [selectedEmp, setSelectedEmp] = useState<Employee360>(SELECTED_EMP);

  const statusCfg = {
    ACTIVE:    { label: 'Active',    color: 'hsl(var(--success))', bg: 'hsl(var(--success)/0.1)' },
    ON_LEAVE:  { label: 'On Leave',  color: 'hsl(var(--primary))', bg: 'hsl(var(--primary)/0.1)' },
    PROBATION: { label: 'Probation', color: 'hsl(var(--warning))', bg: 'hsl(var(--warning)/0.1)' },
  };

  const status = statusCfg[selectedEmp.status];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header with employee selector */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]">
          <Users size={22} className="text-[hsl(var(--primary))]" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Employee 360°</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Comprehensive employee profile view</p>
        </div>
        <select
          value={selectedEmp.id}
          onChange={e => { const emp = EMPLOYEES.find(em => em.id === e.target.value); if (emp) setSelectedEmp(emp); }}
          className="px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
        >
          {EMPLOYEES.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.empCode}</option>)}
        </select>
      </div>

      {/* Employee hero card */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.06)] rounded-2xl border border-[hsl(var(--primary)/0.2)] p-5 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
          {selectedEmp.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedEmp.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: status.color, background: status.bg }}>{status.label}</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedEmp.designation} · {selectedEmp.department} · {selectedEmp.empCode}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Reports to: {selectedEmp.reportingTo} · Joined {selectedEmp.joinDate}</p>
        </div>
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {[
            { label: 'CTC', value: selectedEmp.ctc },
            { label: 'Grade', value: selectedEmp.grade },
            { label: 'Location', value: selectedEmp.location },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-sm font-bold text-[hsl(var(--foreground))]">{s.value}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap mb-6 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'       && <ProfileTab emp={selectedEmp} />}
      {activeTab === 'employment'    && <EmploymentTab emp={selectedEmp} />}
      {activeTab === 'payroll'       && <PayrollTab emp={selectedEmp} />}
      {activeTab === 'attendance'    && <AttendanceTab />}
      {activeTab === 'leave'         && <LeaveTab />}
      {activeTab === 'assets'        && <AssetsTab />}
      {activeTab === 'training'      && <TrainingTab />}
      {activeTab === 'performance'   && <PerformanceTab />}
      {activeTab === 'timeline'      && <TimelineTab />}
      {activeTab === 'documents'     && <DocumentsTab />}
      {activeTab === 'emergency'     && <EmergencyTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  );
};

export default Employee360Page;

// yss_orbit\frontend\src\pages\hrms\AttendanceDashboardPage.tsx
import React, { useState, useMemo } from 'react';
import { formatIST } from '@/utils/date';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Users,
  Search, Filter, Download, BarChart3, Calendar,
  ArrowRight, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  LogIn, LogOut, AlarmClock, MinusCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
type ViewMode = 'TODAY' | 'MONTHLY' | 'REPORTS';

interface AttendanceRecord {
  id: string;
  employeeName: string;
  empCode: string;
  department: string;
  avatar: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | null;
  status: AttendanceStatus;
  lateBy?: number;        // minutes
  date: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
}

interface MonthlySummary {
  empCode: string;
  employeeName: string;
  avatar: string;
  department: string;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  lateDays: number;
  leaveDays: number;
  totalWorkingDays: number;
  lopDays: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TODAY_RECORDS: AttendanceRecord[] = [
  { id: 'at1', employeeName: 'Arjun Kumar',   empCode: 'EMP001', department: 'Engineering', avatar: 'AK', checkIn: '09:02', checkOut: null,   workingHours: null, status: 'PRESENT',  date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at2', employeeName: 'Priya Sharma',  empCode: 'EMP002', department: 'Product',     avatar: 'PS', checkIn: '09:45', checkOut: null,   workingHours: null, status: 'LATE',     lateBy: 45, date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at3', employeeName: 'Rohan Mehta',   empCode: 'EMP003', department: 'Design',      avatar: 'RM', checkIn: null,    checkOut: null,   workingHours: null, status: 'ON_LEAVE', date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at4', employeeName: 'Sneha Iyer',    empCode: 'EMP004', department: 'HR',          avatar: 'SI', checkIn: '08:55', checkOut: null,   workingHours: null, status: 'PRESENT',  date: '2026-06-11', shiftName: 'Morning',  shiftStart: '08:30', shiftEnd: '17:30' },
  { id: 'at5', employeeName: 'Vikram Nair',   empCode: 'EMP005', department: 'Infra',       avatar: 'VN', checkIn: '10:20', checkOut: null,   workingHours: null, status: 'LATE',     lateBy: 80, date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at6', employeeName: 'Deepa Reddy',   empCode: 'EMP006', department: 'Finance',     avatar: 'DR', checkIn: null,    checkOut: null,   workingHours: null, status: 'ABSENT',   date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at7', employeeName: 'Kiran Rao',     empCode: 'EMP007', department: 'Engineering', avatar: 'KR', checkIn: '09:01', checkOut: '13:00',workingHours: 4,    status: 'HALF_DAY', date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at8', employeeName: 'Meena Pillai',  empCode: 'EMP008', department: 'HR',          avatar: 'MP', checkIn: '09:08', checkOut: null,   workingHours: null, status: 'PRESENT',  date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
  { id: 'at9', employeeName: 'Suresh Rajan',  empCode: 'EMP009', department: 'Engineering', avatar: 'SR', checkIn: '08:50', checkOut: null,   workingHours: null, status: 'PRESENT',  date: '2026-06-11', shiftName: 'Morning',  shiftStart: '08:30', shiftEnd: '17:30' },
  { id: 'at10',employeeName: 'Ananya Patel',  empCode: 'EMP010', department: 'Sales',       avatar: 'AP', checkIn: null,    checkOut: null,   workingHours: null, status: 'ON_LEAVE', date: '2026-06-11', shiftName: 'General',  shiftStart: '09:00', shiftEnd: '18:00' },
];

const MONTHLY_SUMMARY: MonthlySummary[] = [
  { empCode: 'EMP001', employeeName: 'Arjun Kumar',  avatar: 'AK', department: 'Engineering', presentDays: 20, absentDays: 0, halfDays: 1, lateDays: 2, leaveDays: 0, totalWorkingDays: 21, lopDays: 0 },
  { empCode: 'EMP002', employeeName: 'Priya Sharma', avatar: 'PS', department: 'Product',     presentDays: 18, absentDays: 1, halfDays: 0, lateDays: 5, leaveDays: 2, totalWorkingDays: 21, lopDays: 1 },
  { empCode: 'EMP003', employeeName: 'Rohan Mehta',  avatar: 'RM', department: 'Design',      presentDays: 19, absentDays: 0, halfDays: 0, lateDays: 1, leaveDays: 2, totalWorkingDays: 21, lopDays: 0 },
  { empCode: 'EMP004', employeeName: 'Sneha Iyer',   avatar: 'SI', department: 'HR',          presentDays: 21, absentDays: 0, halfDays: 0, lateDays: 0, leaveDays: 0, totalWorkingDays: 21, lopDays: 0 },
  { empCode: 'EMP005', employeeName: 'Vikram Nair',  avatar: 'VN', department: 'Infra',       presentDays: 16, absentDays: 3, halfDays: 0, lateDays: 8, leaveDays: 2, totalWorkingDays: 21, lopDays: 3 },
  { empCode: 'EMP006', employeeName: 'Deepa Reddy',  avatar: 'DR', department: 'Finance',     presentDays: 20, absentDays: 1, halfDays: 1, lateDays: 3, leaveDays: 0, totalWorkingDays: 21, lopDays: 1 },
];

const STATUS_CFG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PRESENT:  { label: 'Present',   color: 'hsl(var(--success))',          bg: 'hsl(var(--success)/0.1)',          icon: <CheckCircle size={12} /> },
  ABSENT:   { label: 'Absent',    color: 'hsl(var(--destructive))',      bg: 'hsl(var(--destructive)/0.1)',      icon: <XCircle size={12} /> },
  HALF_DAY: { label: 'Half Day',  color: 'hsl(var(--warning))',          bg: 'hsl(var(--warning)/0.1)',          icon: <MinusCircle size={12} /> },
  LATE:     { label: 'Late',      color: 'hsl(var(--accent))',           bg: 'hsl(var(--accent)/0.1)',           icon: <AlarmClock size={12} /> },
  ON_LEAVE: { label: 'On Leave',  color: 'hsl(var(--primary))',          bg: 'hsl(var(--primary)/0.1)',          icon: <Calendar size={12} /> },
  HOLIDAY:  { label: 'Holiday',   color: 'hsl(var(--teal))',             bg: 'hsl(var(--teal)/0.1)',             icon: <CheckCircle size={12} /> },
  WEEKEND:  { label: 'Weekend',   color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))',                icon: <MinusCircle size={12} /> },
};

// ─── Today View ───────────────────────────────────────────────────────────────

const TodayView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | ''>('');
  const [filterDept, setFilterDept] = useState('');

  const depts = [...new Set(TODAY_RECORDS.map(r => r.department))].sort();

  const filtered = useMemo(() => TODAY_RECORDS.filter(r => {
    const matchSearch = !search || r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.empCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchDept = !filterDept || r.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  }), [search, filterStatus, filterDept]);

  const counts = useMemo(() => ({
    present: TODAY_RECORDS.filter(r => r.status === 'PRESENT').length,
    absent: TODAY_RECORDS.filter(r => r.status === 'ABSENT').length,
    late: TODAY_RECORDS.filter(r => r.status === 'LATE').length,
    onLeave: TODAY_RECORDS.filter(r => r.status === 'ON_LEAVE').length,
    halfDay: TODAY_RECORDS.filter(r => r.status === 'HALF_DAY').length,
    total: TODAY_RECORDS.length,
  }), []);

  const attendancePct = Math.round(((counts.present + counts.late + counts.halfDay) / counts.total) * 100);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Present', value: counts.present,  color: 'var(--success)',          icon: <CheckCircle size={16} /> },
          { label: 'Late',    value: counts.late,     color: 'var(--accent)',            icon: <AlarmClock size={16} /> },
          { label: 'Half Day',value: counts.halfDay,  color: 'var(--warning)',           icon: <MinusCircle size={16} /> },
          { label: 'Absent',  value: counts.absent,   color: 'var(--destructive)',       icon: <XCircle size={16} /> },
          { label: 'On Leave',value: counts.onLeave,  color: 'var(--primary)',           icon: <Calendar size={16} /> },
          { label: 'Attendance%',value: `${attendancePct}%`, color: 'var(--teal)',      icon: <TrendingUp size={16} /> },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-3 border border-[hsl(var(--border))] shadow-sm text-center">
            <div className="flex items-center justify-center mb-1.5" style={{ color: `hsl(${s.color})` }}>{s.icon}</div>
            <p className="text-xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance progress bar */}
      <div className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
        <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-2">
          <span>Today's Attendance — {formatIST(new Date(), 'PPP')}</span>
          <span className="font-semibold text-[hsl(var(--success))]">{attendancePct}% Present</span>
        </div>
        <div className="h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden flex">
          <div className="h-3 bg-[hsl(var(--success))]" style={{ width: `${(counts.present / counts.total) * 100}%`, transition: 'width 0.7s ease' }} title={`Present: ${counts.present}`} />
          <div className="h-3 bg-[hsl(var(--accent))]" style={{ width: `${(counts.late / counts.total) * 100}%`, transition: 'width 0.7s ease' }} title={`Late: ${counts.late}`} />
          <div className="h-3 bg-[hsl(var(--warning))]" style={{ width: `${(counts.halfDay / counts.total) * 100}%`, transition: 'width 0.7s ease' }} title={`Half Day: ${counts.halfDay}`} />
          <div className="h-3 bg-[hsl(var(--primary)/0.6)]" style={{ width: `${(counts.onLeave / counts.total) * 100}%`, transition: 'width 0.7s ease' }} title={`On Leave: ${counts.onLeave}`} />
          <div className="h-3 bg-[hsl(var(--destructive)/0.7)]" style={{ width: `${(counts.absent / counts.total) * 100}%`, transition: 'width 0.7s ease' }} title={`Absent: ${counts.absent}`} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          {[
            { label: 'Present', color: 'hsl(var(--success))' },
            { label: 'Late', color: 'hsl(var(--accent))' },
            { label: 'Half Day', color: 'hsl(var(--warning))' },
            { label: 'On Leave', color: 'hsl(var(--primary)/0.6)' },
            { label: 'Absent', color: 'hsl(var(--destructive)/0.7)' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))] mr-auto">Employee Attendance</h3>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="pl-8 pr-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] w-44" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Status</option>
            {(['PRESENT','LATE','HALF_DAY','ABSENT','ON_LEAVE'] as AttendanceStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Depts</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
            <Download size={12} />Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Employee', 'Shift', 'Check In', 'Check Out', 'Hours', 'Status', 'Late By'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const cfg = STATUS_CFG[rec.status];
                return (
                  <tr key={rec.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">{rec.avatar}</div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{rec.employeeName}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{rec.empCode} · {rec.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">{rec.shiftName}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{rec.shiftStart} – {rec.shiftEnd}</p>
                    </td>
                    <td className="px-4 py-3">
                      {rec.checkIn ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--foreground))]">
                          <LogIn size={11} className="text-[hsl(var(--success))]" />{rec.checkIn}
                        </span>
                      ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {rec.checkOut ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--foreground))]">
                          <LogOut size={11} className="text-[hsl(var(--destructive))]" />{rec.checkOut}
                        </span>
                      ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">In Progress</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[hsl(var(--foreground))]">
                      {rec.workingHours != null ? `${rec.workingHours}h` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {rec.lateBy ? (
                        <span className="text-xs font-medium text-[hsl(var(--accent))]">{rec.lateBy} min</span>
                      ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Monthly View ─────────────────────────────────────────────────────────────

const MonthlyView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(5); // June (0-indexed)
  const [year, setYear] = useState(2026);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const filtered = MONTHLY_SUMMARY.filter(r =>
    !search || r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.empCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <button onClick={() => { let m = month - 1; let y = year; if (m < 0) { m = 11; y--; } setMonth(m); setYear(y); }} className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"><ChevronLeft size={15} /></button>
        <span className="text-sm font-semibold text-[hsl(var(--foreground))] min-w-28 text-center">{MONTHS[month]} {year}</span>
        <button onClick={() => { let m = month + 1; let y = year; if (m > 11) { m = 0; y++; } setMonth(m); setYear(y); }} className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors"><ChevronRight size={15} /></button>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="pl-8 pr-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none w-44" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors"><Download size={12} />Export</button>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Employee', 'Working Days', 'Present', 'Absent', 'Half Day', 'Late Days', 'Leave Days', 'LOP', 'Attendance %'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const pct = Math.round(((rec.presentDays + rec.halfDays * 0.5) / rec.totalWorkingDays) * 100);
                const pctColor = pct >= 90 ? 'hsl(var(--success))' : pct >= 75 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
                return (
                  <tr key={rec.empCode} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">{rec.avatar}</div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{rec.employeeName}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{rec.empCode} · {rec.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))]">{rec.totalWorkingDays}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--success))]">{rec.presentDays}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--destructive))]">{rec.absentDays}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--warning))]">{rec.halfDays}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--accent))]">{rec.lateDays}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))]">{rec.leaveDays}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: rec.lopDays > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}>{rec.lopDays}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pctColor }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: pctColor }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Reports View ─────────────────────────────────────────────────────────────

const AttendanceReportsView: React.FC = () => {
  const deptData = [
    { dept: 'Engineering', pct: 94, color: 'hsl(var(--primary))' },
    { dept: 'HR',          pct: 98, color: 'hsl(var(--accent))' },
    { dept: 'Finance',     pct: 96, color: 'hsl(var(--teal))' },
    { dept: 'Sales',       pct: 88, color: 'hsl(var(--warning))' },
    { dept: 'Design',      pct: 92, color: 'hsl(var(--success))' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Avg Attendance %', value: '93.6%', color: 'var(--success)',     sub: 'Jun 2026 YTD' },
          { label: 'Total Late Entries', value: '218', color: 'var(--accent)',      sub: 'Jun 2026' },
          { label: 'LOP Days (Month)',  value: '16',   color: 'var(--destructive)', sub: 'Impacting payroll' },
          { label: 'Absent (Month)',    value: '31',   color: 'var(--warning)',     sub: '247 employees' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
        <h3 className="font-bold text-[hsl(var(--foreground))] mb-4">Attendance % by Department (Jun 2026)</h3>
        <div className="space-y-3">
          {deptData.map(d => (
            <div key={d.dept} className="flex items-center gap-3">
              <span className="text-xs text-[hsl(var(--muted-foreground))] w-24 shrink-0">{d.dept}</span>
              <div className="flex-1 h-6 rounded-lg bg-[hsl(var(--muted)/0.5)] overflow-hidden">
                <div className="h-6 rounded-lg flex items-center pl-2 transition-all duration-700" style={{ width: `${d.pct}%`, background: d.color }}>
                  <span className="text-[10px] font-bold text-white">{d.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: 'TODAY',   label: "Today's View",     icon: <Clock size={15} /> },
  { key: 'MONTHLY', label: 'Monthly Summary', icon: <Calendar size={15} /> },
  { key: 'REPORTS', label: 'Reports',          icon: <BarChart3 size={15} /> },
];

export const AttendanceDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewMode>('TODAY');

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--teal)/0.12)]">
            <Clock size={22} className="text-[hsl(var(--teal))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Attendance Dashboard</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Real-time attendance tracking, daily view, and monthly reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />Live
          </span>
          <span className="text-xs">Updates every 5 min</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'TODAY'   && <TodayView />}
      {activeTab === 'MONTHLY' && <MonthlyView />}
      {activeTab === 'REPORTS' && <AttendanceReportsView />}
    </div>
  );
};

export default AttendanceDashboardPage;

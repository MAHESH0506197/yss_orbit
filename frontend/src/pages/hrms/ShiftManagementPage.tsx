// yss_orbit\frontend\src\pages\hrms\ShiftManagementPage.tsx
import React, { useState } from 'react';
import {
  Clock, Plus, Search, Edit2, Trash2, X, Check,
  Moon, Sun, Sunset, Coffee, AlertCircle, Users,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FLEXIBLE' | 'SPLIT';

interface Shift {
  id: string;
  name: string;
  code: string;
  shiftType: ShiftType;
  startTime: string;    // HH:MM
  endTime: string;
  breakMinutes: number;
  isOvernight: boolean;
  gracePeriodMinutes: number;
  employeeCount: number;
  isActive: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SHIFTS: Shift[] = [
  { id: 's1', name: 'Morning Shift',   code: 'MRN', shiftType: 'MORNING',   startTime: '07:00', endTime: '15:00', breakMinutes: 30, isOvernight: false, gracePeriodMinutes: 10, employeeCount: 28, isActive: true },
  { id: 's2', name: 'General Shift',   code: 'GEN', shiftType: 'MORNING',   startTime: '09:00', endTime: '18:00', breakMinutes: 60, isOvernight: false, gracePeriodMinutes: 15, employeeCount: 42, isActive: true },
  { id: 's3', name: 'Afternoon Shift', code: 'AFT', shiftType: 'AFTERNOON', startTime: '14:00', endTime: '22:00', breakMinutes: 30, isOvernight: false, gracePeriodMinutes: 10, employeeCount: 16, isActive: true },
  { id: 's4', name: 'Night Shift',     code: 'NGT', shiftType: 'NIGHT',     startTime: '22:00', endTime: '06:00', breakMinutes: 30, isOvernight: true,  gracePeriodMinutes: 15, employeeCount: 11, isActive: true },
  { id: 's5', name: 'Flexi Shift',     code: 'FLX', shiftType: 'FLEXIBLE',  startTime: '08:00', endTime: '20:00', breakMinutes: 60, isOvernight: false, gracePeriodMinutes: 60, employeeCount: 35, isActive: true },
  { id: 's6', name: 'Split Shift A',   code: 'SPL', shiftType: 'SPLIT',     startTime: '06:00', endTime: '14:00', breakMinutes: 30, isOvernight: false, gracePeriodMinutes: 10, employeeCount: 8,  isActive: false },
];

const SHIFT_ICONS: Record<ShiftType, { icon: React.ReactNode; color: string; bg: string }> = {
  MORNING:   { icon: <Sun size={15} />,    color: 'hsl(var(--warning))',     bg: 'hsl(var(--warning)/0.1)' },
  AFTERNOON: { icon: <Sunset size={15} />, color: '#f97316',                 bg: '#f9731618' },
  NIGHT:     { icon: <Moon size={15} />,   color: 'hsl(var(--accent))',      bg: 'hsl(var(--accent)/0.1)' },
  FLEXIBLE:  { icon: <Coffee size={15} />, color: 'hsl(var(--teal))',        bg: 'hsl(var(--teal)/0.1)' },
  SPLIT:     { icon: <Clock size={15} />,  color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))' },
};

function calcHours(start: string, end: string, overnight: boolean, breakMin: number): string {
  const [sh = 0, sm = 0] = start.split(':').map(Number);
  const [eh = 0, em = 0] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (overnight || mins < 0) mins += 24 * 60;
  const net = mins - breakMin;
  return `${Math.floor(net / 60)}h ${net % 60}m`;
}

// ─── Shift Modal ──────────────────────────────────────────────────────────────

const ShiftModal: React.FC<{ shift: Partial<Shift> | null; onClose: () => void; onSave: (s: Partial<Shift>) => void }> = ({ shift, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Shift>>(shift || { shiftType: 'MORNING', breakMinutes: 60, isOvernight: false, gracePeriodMinutes: 15, isActive: true });
  const isEdit = !!shift?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">{isEdit ? 'Edit' : 'New'} Shift</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Shift Name *</label>
            <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning Shift" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Code</label>
            <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. MRN" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Shift Type</label>
            <select value={form.shiftType || 'MORNING'} onChange={e => setForm(f => ({ ...f, shiftType: e.target.value as ShiftType }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
              {(['MORNING','AFTERNOON','NIGHT','FLEXIBLE','SPLIT'] as ShiftType[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Start Time</label>
            <input type="time" value={form.startTime || '09:00'} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">End Time</label>
            <input type="time" value={form.endTime || '18:00'} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Break (minutes)</label>
            <input type="number" value={form.breakMinutes ?? 60} onChange={e => setForm(f => ({ ...f, breakMinutes: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Grace Period (minutes)</label>
            <input type="number" value={form.gracePeriodMinutes ?? 15} onChange={e => setForm(f => ({ ...f, gracePeriodMinutes: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isOvernight ?? false} onChange={e => setForm(f => ({ ...f, isOvernight: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm text-[hsl(var(--foreground))]">Overnight Shift</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm text-[hsl(var(--foreground))]">Active</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-[hsl(var(--border))]">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <span className="flex items-center justify-center gap-2"><Check size={14} />{isEdit ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const ShiftManagementPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ shift: Partial<Shift> | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const filtered = shifts.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (form: Partial<Shift>) => {
    if (form.id) {
      setShifts(ss => ss.map(s => s.id === form.id ? { ...s, ...form } as Shift : s));
    } else {
      setShifts(ss => [...ss, { ...form, id: `s${Date.now()}`, employeeCount: 0 } as Shift]);
    }
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--warning)/0.15)]">
            <Clock size={22} className="text-[hsl(var(--warning))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Shift Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Define work shifts, timing, and grace periods</p>
          </div>
        </div>
        <button onClick={() => setModal({ shift: null })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />New Shift
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Shifts', value: shifts.length, color: 'var(--primary)' },
          { label: 'Active', value: shifts.filter(s => s.isActive).length, color: 'var(--success)' },
          { label: 'Overnight', value: shifts.filter(s => s.isOvernight).length, color: 'var(--accent)' },
          { label: 'Employees Covered', value: shifts.reduce((a, s) => a + s.employeeCount, 0), color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shift name or code…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
      </div>

      {/* Grid of Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(shift => {
          const { icon, color, bg } = SHIFT_ICONS[shift.shiftType];
          const hours = calcHours(shift.startTime, shift.endTime, shift.isOvernight, shift.breakMinutes);
          return (
            <div key={shift.id} className={`bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group ${!shift.isActive ? 'opacity-60' : ''}`}>
              {/* Card top accent */}
              <div className="h-1 w-full" style={{ background: color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ background: bg, color }}>
                      {icon}
                    </div>
                    <div>
                      <p className="font-bold text-[hsl(var(--foreground))]">{shift.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{shift.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ shift })} className="p-1.5 rounded-lg hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteTarget(shift)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Start</p>
                    <p className="text-sm font-bold text-[hsl(var(--foreground))] font-mono">{shift.startTime}</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">End</p>
                    <p className="text-sm font-bold text-[hsl(var(--foreground))] font-mono">{shift.endTime}</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-[hsl(var(--muted)/0.5)]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Net</p>
                    <p className="text-xs font-bold text-[hsl(var(--foreground))]">{hours}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Break: {shift.breakMinutes}m • Grace: {shift.gracePeriodMinutes}m</span>
                  <div className="flex items-center gap-3">
                    {shift.isOvernight && <span className="flex items-center gap-1" style={{ color }}><Moon size={11} />Overnight</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{shift.employeeCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && <ShiftModal shift={modal.shift} onClose={() => setModal(null)} onSave={handleSave} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[hsl(var(--destructive)/0.12)]"><AlertCircle size={20} className="text-[hsl(var(--destructive))]" /></div>
              <h3 className="font-bold text-[hsl(var(--foreground))]">Delete Shift</h3>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Delete <strong className="text-[hsl(var(--foreground))]">{deleteTarget.name}</strong>? Employees on this shift will need reassignment.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
              <button onClick={() => { setShifts(ss => ss.filter(s => s.id !== deleteTarget.id)); setDeleteTarget(null); }} className="flex-1 py-2 rounded-xl bg-[hsl(var(--destructive))] text-white text-sm font-medium hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagementPage;


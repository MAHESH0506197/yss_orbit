// yss_orbit\frontend\src\pages\hrms\DesignationManagementPage.tsx
import React, { useState } from 'react';
import {
  Briefcase, Plus, Search, Edit2, Trash2, X, Check,
  AlertCircle, Award, TrendingUp, Users,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Designation {
  id: string;
  title: string;
  code: string;
  department: string;
  level: number;        // 1 = Entry, 5 = C-Suite
  grade: string;        // L1, L2 … L8
  minCTC: number;
  maxCTC: number;
  employeeCount: number;
  isActive: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DESIGNATIONS: Designation[] = [
  { id: 'dg1',  title: 'Software Engineer',            code: 'SDE',    department: 'Engineering', level: 2, grade: 'L2', minCTC: 600000,  maxCTC: 1200000, employeeCount: 18, isActive: true  },
  { id: 'dg2',  title: 'Senior Software Engineer',     code: 'SSDE',   department: 'Engineering', level: 3, grade: 'L3', minCTC: 1200000, maxCTC: 2000000, employeeCount: 12, isActive: true  },
  { id: 'dg3',  title: 'Lead Engineer',                code: 'LE',     department: 'Engineering', level: 4, grade: 'L4', minCTC: 1800000, maxCTC: 3000000, employeeCount: 5,  isActive: true  },
  { id: 'dg4',  title: 'Engineering Manager',          code: 'EM',     department: 'Engineering', level: 5, grade: 'L5', minCTC: 2500000, maxCTC: 4500000, employeeCount: 3,  isActive: true  },
  { id: 'dg5',  title: 'VP Engineering',               code: 'VP-ENG', department: 'Engineering', level: 6, grade: 'L6', minCTC: 4000000, maxCTC: 8000000, employeeCount: 1,  isActive: true  },
  { id: 'dg6',  title: 'HR Executive',                 code: 'HRE',    department: 'HR',          level: 2, grade: 'L2', minCTC: 400000,  maxCTC: 800000,  employeeCount: 4,  isActive: true  },
  { id: 'dg7',  title: 'HR Manager',                   code: 'HRM',    department: 'HR',          level: 4, grade: 'L4', minCTC: 900000,  maxCTC: 1600000, employeeCount: 2,  isActive: true  },
  { id: 'dg8',  title: 'Financial Analyst',            code: 'FA',     department: 'Finance',     level: 2, grade: 'L2', minCTC: 700000,  maxCTC: 1200000, employeeCount: 4,  isActive: true  },
  { id: 'dg9',  title: 'Finance Manager',              code: 'FM',     department: 'Finance',     level: 4, grade: 'L4', minCTC: 1200000, maxCTC: 2200000, employeeCount: 2,  isActive: true  },
  { id: 'dg10', title: 'Chief Financial Officer',      code: 'CFO',    department: 'Finance',     level: 8, grade: 'L8', minCTC: 8000000, maxCTC: 18000000, employeeCount: 1, isActive: true  },
  { id: 'dg11', title: 'Sales Executive',              code: 'SE',     department: 'Sales',       level: 2, grade: 'L2', minCTC: 400000,  maxCTC: 900000,  employeeCount: 8,  isActive: true  },
  { id: 'dg12', title: 'Intern',                       code: 'INT',    department: 'Engineering', level: 1, grade: 'L1', minCTC: 200000,  maxCTC: 400000,  employeeCount: 4,  isActive: false },
];

const LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Intern',     color: 'hsl(var(--muted-foreground))' },
  2: { label: 'Junior',     color: '#0d9488' },
  3: { label: 'Mid',        color: '#2563eb' },
  4: { label: 'Senior',     color: '#7c3aed' },
  5: { label: 'Lead',       color: '#c026d3' },
  6: { label: 'Manager',    color: '#ea580c' },
  7: { label: 'Director',   color: '#dc2626' },
  8: { label: 'C-Suite',    color: '#1c1917' },
};

const fmt = (n: number) => `â‚¹${(n / 100000).toFixed(1)}L`;

// ─── Modal ────────────────────────────────────────────────────────────────────

const DesignationModal: React.FC<{
  dsg: Partial<Designation> | null;
  onClose: () => void;
  onSave: (d: Partial<Designation>) => void;
}> = ({ dsg, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Designation>>(dsg || { isActive: true, level: 2 });
  const isEdit = !!dsg?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-lg border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">{isEdit ? 'Edit' : 'New'} Designation</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Designation Title *</label>
            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Software Engineer" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Code *</label>
            <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SSDE" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Grade</label>
            <input value={form.grade || ''} onChange={e => setForm(f => ({ ...f, grade: e.target.value.toUpperCase() }))} placeholder="e.g. L3" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Department</label>
            <select value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
              <option value="">Select…</option>
              {['Engineering', 'HR', 'Finance', 'Sales', 'Operations', 'Marketing'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Level (1â€“8)</label>
            <input type="number" min={1} max={8} value={form.level || 2} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Min CTC (â‚¹)</label>
            <input type="number" value={form.minCTC || ''} onChange={e => setForm(f => ({ ...f, minCTC: Number(e.target.value) }))} placeholder="600000" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Max CTC (â‚¹)</label>
            <input type="number" value={form.maxCTC || ''} onChange={e => setForm(f => ({ ...f, maxCTC: Number(e.target.value) }))} placeholder="1200000" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">Active</span>
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

export const DesignationManagementPage: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>(MOCK_DESIGNATIONS);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modal, setModal] = useState<{ dsg: Partial<Designation> | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);

  const departments = [...new Set(designations.map(d => d.department))].sort();

  const filtered = designations.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || d.department === filterDept;
    return matchSearch && matchDept;
  });

  const handleSave = (form: Partial<Designation>) => {
    if (form.id) {
      setDesignations(ds => ds.map(d => d.id === form.id ? { ...d, ...form } as Designation : d));
    } else {
      setDesignations(ds => [...ds, { ...form, id: `dg${Date.now()}`, employeeCount: 0 } as Designation]);
    }
    setModal(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--accent)/0.12)]">
            <Award size={22} className="text-[hsl(var(--accent))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Designation Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage job designations, grades, and CTC bands</p>
          </div>
        </div>
        <button onClick={() => setModal({ dsg: null })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--accent)/0.3)]">
          <Plus size={16} />New Designation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Designations', value: designations.length, icon: <Briefcase size={18} />, color: 'var(--accent)' },
          { label: 'Active', value: designations.filter(d => d.isActive).length, icon: <Check size={18} />, color: 'var(--success)' },
          { label: 'Departments Covered', value: departments.length, icon: <TrendingUp size={18} />, color: 'var(--primary)' },
          { label: 'Total Employees', value: designations.reduce((s, d) => s + d.employeeCount, 0), icon: <Users size={18} />, color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              <div className="p-1.5 rounded-lg" style={{ background: `hsl(${s.color}/0.12)`, color: `hsl(${s.color})` }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search designation or code…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
              {['Designation', 'Department', 'Grade / Level', 'CTC Band', 'Employees', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(dsg => {
              const lvl = LEVEL_LABELS[dsg.level] ?? LEVEL_LABELS[2]!;
              return (
                <tr key={dsg.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[hsl(var(--accent)/0.1)]">
                        <Briefcase size={13} className="text-[hsl(var(--accent))]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{dsg.title}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{dsg.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{dsg.department}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[hsl(var(--foreground))]">{dsg.grade}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${lvl.color}18`, color: lvl.color }}>{lvl.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    <span>{fmt(dsg.minCTC)} â€“ {fmt(dsg.maxCTC)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users size={13} className="text-[hsl(var(--muted-foreground))]" />
                      <span className="font-medium text-[hsl(var(--foreground))]">{dsg.employeeCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dsg.isActive ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dsg.isActive ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--muted-foreground))]'}`} />
                      {dsg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal({ dsg })} className="p-1.5 rounded-lg hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(dsg)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No designations found.</div>
        )}
      </div>

      {modal && <DesignationModal dsg={modal.dsg} onClose={() => setModal(null)} onSave={handleSave} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[hsl(var(--destructive)/0.12)]"><AlertCircle size={20} className="text-[hsl(var(--destructive))]" /></div>
              <h3 className="font-bold text-[hsl(var(--foreground))]">Delete Designation</h3>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Delete <strong className="text-[hsl(var(--foreground))]">{deleteTarget.title}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
              <button onClick={() => { setDesignations(ds => ds.filter(d => d.id !== deleteTarget.id)); setDeleteTarget(null); }} className="flex-1 py-2 rounded-xl bg-[hsl(var(--destructive))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationManagementPage;


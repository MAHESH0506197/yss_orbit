// yss_orbit\frontend\src\pages\hrms\AssetManagementPage.tsx
import React, { useState, useMemo } from 'react';
import { formatIST } from '@/utils/date';
import {
  Package, Plus, Search, Edit2, Eye, Filter,
  Laptop, Monitor, Phone, Headphones, Car,
  CheckCircle, Clock, AlertCircle, X, Check,
  ArrowUpRight, Users,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_REPAIR' | 'RETIRED' | 'LOST';
type AssetCategory = 'LAPTOP' | 'MONITOR' | 'PHONE' | 'HEADSET' | 'VEHICLE' | 'OTHER';

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  status: AssetStatus;
  assignedTo: string | null;
  assignedEmpCode: string | null;
  assignedDate: string | null;
  warrantyExpiry: string | null;
  location: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_ASSETS: Asset[] = [
  { id: 'a1',  assetTag: 'AST-001', name: 'MacBook Pro 14"',    category: 'LAPTOP',  brand: 'Apple',    model: 'MBP14-M3',   serialNumber: 'C02XY1234',  purchaseDate: '2024-01-15', purchaseCost: 185000, status: 'ASSIGNED',   assignedTo: 'Arjun Kumar',  assignedEmpCode: 'EMP001', assignedDate: '2024-01-20', warrantyExpiry: '2027-01-15', location: 'HQ' },
  { id: 'a2',  assetTag: 'AST-002', name: 'Dell XPS 15',        category: 'LAPTOP',  brand: 'Dell',     model: 'XPS 15 9560', serialNumber: 'DL9560-AB12',purchaseDate: '2023-08-10', purchaseCost: 120000, status: 'ASSIGNED',   assignedTo: 'Priya Sharma', assignedEmpCode: 'EMP002', assignedDate: '2023-08-15', warrantyExpiry: '2026-08-10', location: 'HQ' },
  { id: 'a3',  assetTag: 'AST-003', name: 'Dell XPS 15',        category: 'LAPTOP',  brand: 'Dell',     model: 'XPS 15 9560', serialNumber: 'DL9560-CD34',purchaseDate: '2023-08-10', purchaseCost: 120000, status: 'AVAILABLE',  assignedTo: null,          assignedEmpCode: null,    assignedDate: null,        warrantyExpiry: '2026-08-10', location: 'IT Store' },
  { id: 'a4',  assetTag: 'AST-004', name: 'LG 27" 4K Monitor',  category: 'MONITOR', brand: 'LG',       model: '27UK850-W',   serialNumber: 'LG27UK-1234',purchaseDate: '2023-06-20', purchaseCost: 35000,  status: 'ASSIGNED',   assignedTo: 'Rahul Mehta', assignedEmpCode: 'EMP003', assignedDate: '2023-07-01', warrantyExpiry: '2026-06-20', location: 'HQ' },
  { id: 'a5',  assetTag: 'AST-005', name: 'iPhone 14 Pro',      category: 'PHONE',   brand: 'Apple',    model: 'A2651',       serialNumber: 'F4DMTXXXXXX',purchaseDate: '2023-10-01', purchaseCost: 95000,  status: 'ASSIGNED',   assignedTo: 'Sneha Patel', assignedEmpCode: 'EMP004', assignedDate: '2023-10-05', warrantyExpiry: '2025-10-01', location: 'HQ' },
  { id: 'a6',  assetTag: 'AST-006', name: 'Sony WH-1000XM5',   category: 'HEADSET', brand: 'Sony',     model: 'WH1000XM5',  serialNumber: 'SN1234567',   purchaseDate: '2024-02-01', purchaseCost: 28000,  status: 'IN_REPAIR',  assignedTo: null,          assignedEmpCode: null,    assignedDate: null,        warrantyExpiry: '2026-02-01', location: 'Repair Center' },
  { id: 'a7',  assetTag: 'AST-007', name: 'Toyota Innova',      category: 'VEHICLE', brand: 'Toyota',   model: 'Innova 2.4G', serialNumber: 'MH12XX1234',  purchaseDate: '2022-03-15', purchaseCost: 1600000,status: 'ASSIGNED',   assignedTo: 'Driver Pool', assignedEmpCode: 'POOL01', assignedDate: '2022-04-01', warrantyExpiry: null,        location: 'Parking Lot' },
  { id: 'a8',  assetTag: 'AST-008', name: 'MacBook Air M2',     category: 'LAPTOP',  brand: 'Apple',    model: 'MBA-M2',      serialNumber: 'C02ZZ5678',   purchaseDate: '2024-03-01', purchaseCost: 115000, status: 'AVAILABLE',  assignedTo: null,          assignedEmpCode: null,    assignedDate: null,        warrantyExpiry: '2027-03-01', location: 'IT Store' },
  { id: 'a9',  assetTag: 'AST-009', name: 'HP LaserJet Pro',    category: 'OTHER',   brand: 'HP',       model: 'M404dn',      serialNumber: 'HP404-9999',  purchaseDate: '2021-09-01', purchaseCost: 22000,  status: 'RETIRED',    assignedTo: null,          assignedEmpCode: null,    assignedDate: null,        warrantyExpiry: null,        location: 'Store Room' },
  { id: 'a10', assetTag: 'AST-010', name: 'Logitech C920 HD',   category: 'OTHER',   brand: 'Logitech', model: 'C920',         serialNumber: 'LGC920-0101', purchaseDate: '2023-12-10', purchaseCost: 8500,   status: 'LOST',       assignedTo: null,          assignedEmpCode: null,    assignedDate: null,        warrantyExpiry: null,        location: '—' },
];

const CATEGORY_ICONS: Record<AssetCategory, React.ReactNode> = {
  LAPTOP:  <Laptop size={16} />,
  MONITOR: <Monitor size={16} />,
  PHONE:   <Phone size={16} />,
  HEADSET: <Headphones size={16} />,
  VEHICLE: <Car size={16} />,
  OTHER:   <Package size={16} />,
};

const STATUS_CFG: Record<AssetStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  AVAILABLE:  { label: 'Available',  color: 'hsl(var(--success))',     bg: 'hsl(var(--success)/0.1)',     icon: <CheckCircle size={11} /> },
  ASSIGNED:   { label: 'Assigned',   color: 'hsl(var(--primary))',     bg: 'hsl(var(--primary)/0.1)',     icon: <ArrowUpRight size={11} /> },
  IN_REPAIR:  { label: 'In Repair',  color: 'hsl(var(--warning))',     bg: 'hsl(var(--warning)/0.1)',     icon: <Clock size={11} /> },
  RETIRED:    { label: 'Retired',    color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))',      icon: <X size={11} /> },
  LOST:       { label: 'Lost',       color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive)/0.1)',icon: <AlertCircle size={11} /> },
};

const fmt = (n: number) => `₹${formatIST(n, 'PP pp')}`;

// ─── Asset Detail Drawer ──────────────────────────────────────────────────────

const AssetDrawer: React.FC<{ asset: Asset; onClose: () => void }> = ({ asset, onClose }) => {
  const { label, color, bg, icon } = STATUS_CFG[asset.status];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30 backdrop-blur-sm" />
      <div className="w-96 bg-[hsl(var(--card))] shadow-2xl border-l border-[hsl(var(--border))] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <div>
            <p className="font-bold text-[hsl(var(--foreground))]">{asset.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{asset.assetTag}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex justify-center p-6 rounded-2xl bg-[hsl(var(--muted)/0.5)]">
            <div className="p-4 rounded-2xl bg-[hsl(var(--card))] shadow-sm text-[hsl(var(--primary))]">
              {CATEGORY_ICONS[asset.category]}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Brand', asset.brand], ['Model', asset.model],
              ['Serial No.', asset.serialNumber], ['Location', asset.location],
              ['Purchase Date', asset.purchaseDate], ['Purchase Cost', fmt(asset.purchaseCost)],
              ['Warranty', asset.warrantyExpiry || 'N/A'], ['Category', asset.category],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)]">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{k}</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Status</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ color, background: bg }}>
              {icon}{label}
            </span>
          </div>
          {asset.assignedTo && (
            <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.04)]">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Assigned To</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center text-sm font-bold text-[hsl(var(--primary))]">
                  {asset.assignedTo[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{asset.assignedTo}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{asset.assignedEmpCode} • Since {asset.assignedDate}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const AssetManagementPage: React.FC = () => {
  const [assets] = useState<Asset[]>(MOCK_ASSETS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | ''>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filtered = useMemo(() => assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.assetTag.toLowerCase().includes(search.toLowerCase()) || (a.assignedTo?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchCat = !filterCategory || a.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  }), [assets, search, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.status === 'AVAILABLE').length,
    assigned: assets.filter(a => a.status === 'ASSIGNED').length,
    inRepair: assets.filter(a => a.status === 'IN_REPAIR').length,
    totalValue: assets.reduce((s, a) => s + a.purchaseCost, 0),
  }), [assets]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--teal)/0.12)]">
            <Package size={22} className="text-[hsl(var(--teal))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Asset Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Track and manage company assets and assignments</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Assets', value: stats.total, color: 'var(--primary)' },
          { label: 'Available', value: stats.available, color: 'var(--success)' },
          { label: 'Assigned', value: stats.assigned, color: 'var(--teal)' },
          { label: 'In Repair', value: stats.inRepair, color: 'var(--warning)' },
          { label: 'Total Value', value: `₹${(stats.totalValue / 100000).toFixed(1)}L`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset, tag, assignee…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
          <option value="">All Status</option>
          {(Object.keys(STATUS_CFG) as AssetStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
          <option value="">All Categories</option>
          {(['LAPTOP','MONITOR','PHONE','HEADSET','VEHICLE','OTHER'] as AssetCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
          <Filter size={13} />{filtered.length} of {assets.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Asset', 'Category', 'Brand / Model', 'Purchase Cost', 'Status', 'Assigned To', 'Warranty', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(asset => {
                const { label, color, bg, icon } = STATUS_CFG[asset.status];
                const isExpired = asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date();
                return (
                  <tr key={asset.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{asset.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{asset.assetTag}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                        {CATEGORY_ICONS[asset.category]}
                        <span className="text-xs">{asset.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">{asset.brand} {asset.model}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[hsl(var(--foreground))]">{fmt(asset.purchaseCost)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color, background: bg }}>
                        {icon}{label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">{asset.assignedTo[0]}</div>
                          <span className="text-sm text-[hsl(var(--foreground))]">{asset.assignedTo}</span>
                        </div>
                      ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {asset.warrantyExpiry ? (
                        <span className={`text-xs font-medium ${isExpired ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--foreground))]'}`}>{asset.warrantyExpiry}</span>
                      ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedAsset(asset)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"><Eye size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"><Edit2 size={13} /></button>
                        {asset.status === 'AVAILABLE' && (
                          <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary)/0.2)] transition-colors">
                            <Users size={11} />Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No assets found.</div>}
        </div>
      </div>

      {selectedAsset && <AssetDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
    </div>
  );
};

export default AssetManagementPage;

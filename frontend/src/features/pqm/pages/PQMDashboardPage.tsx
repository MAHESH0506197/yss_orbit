// yss_orbit/frontend/src/features/pqm/pages/PQMDashboardPage.tsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePqmStore } from "../store/usePqmStore";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { RefetchBar } from "@/components/ui/RefetchBar";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/platform/SectionCard";
import { 
  Activity, 
  AlertTriangle, 
  BarChart, 
  CheckCircle, 
  Clock, 
  FileWarning, 
  ShieldAlert, 
  Plus, 
  ListTodo, 
  Settings,
  Download,
  Printer
} from "lucide-react";

export default function PQMDashboardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { dashboard, dashboardTrends, dashboardLoading, fetchDashboard } = usePqmStore();

  useEffect(() => {
    if (projectId) {
      fetchDashboard(projectId);
    }
  }, [projectId]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (inInput) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (projectId) navigate(`/pqm/nc-management/${projectId}/nc/create`);
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (projectId) fetchDashboard(projectId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, fetchDashboard, projectId]);

  const kpi = dashboard;

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      <PageHeader
        title="PQM Dashboard"
        subtitle={projectId ? "Manage and track non-conformances for this project." : "Manage and track PQM non-conformances across all your projects and contractors."}
        icon={BarChart}
        actions={
          <button
            onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc/create`)}
            aria-label="Raise new NC (N)"
            title="Raise NC (N)"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
            Raise NC
            <kbd className="hidden sm:inline-flex ml-1 items-center rounded border border-violet-400/40 bg-violet-700/30 px-1.5 py-0.5 font-mono text-[10px] text-violet-200">
              N
            </kbd>
          </button>
        }
      />
      <RefetchBar visible={dashboardLoading} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total NCs"
          value={kpi?.total_ncs ?? "—"}
          icon={FileWarning}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc`)}
        />
        <StatCard
          label="Open NCs"
          value={kpi?.open_ncs ?? "—"}
          icon={Activity}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc?status=In Progress`)}
        />
        <StatCard
          label="Overdue"
          value={kpi?.overdue_ncs ?? "—"}
          icon={Clock}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          subLabel="Require immediate attention"
          onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc?overdue=true`)}
        />
        <StatCard
          label="Critical / High"
          value={kpi ? `${kpi.critical_ncs} / ${kpi.high_priority_ncs}` : "—"}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard
          label="Safety Critical Open"
          value={kpi?.safety_critical_open ?? "—"}
          icon={ShieldAlert}
          gradient={kpi && kpi.safety_critical_open > 0 ? "bg-gradient-to-br from-red-600 to-red-700" : "bg-gradient-to-br from-gray-400 to-gray-500"}
        />
        <StatCard
          label="Avg. Closure (days)"
          value={kpi?.avg_closure_days ?? "—"}
          icon={Clock}
          gradient="bg-gradient-to-br from-slate-500 to-slate-600"
        />
        <StatCard
          label="SLA Compliance"
          value={kpi ? `${kpi.sla_compliance_pct}%` : "—"}
          icon={CheckCircle}
          gradient={kpi && kpi.sla_compliance_pct >= 80 ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-amber-500 to-orange-500"}
        />
        <StatCard
          label="Reopen Rate"
          value={kpi ? `${kpi.reopen_rate_pct}%` : "—"}
          icon={AlertTriangle}
          gradient={kpi && kpi.reopen_rate_pct > 10 ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-slate-500 to-slate-600"}
        />
        <StatCard
          label="Closed"
          value={kpi?.closed_ncs ?? "—"}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
      </div>

      {/* Historical Trends */}
      {dashboardTrends && dashboardTrends.length > 0 && (
        <SectionCard title="NC Creation Trends" icon={BarChart}>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dashboardTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Line type="monotone" dataKey="created_count" name="NCs Created" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Activity}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc?status=Submitted`)}
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <ListTodo className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Pending Review</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc?status=Verification Pending`)}
          >
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Pending Verification</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/nc/create`)}
          >
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Raise New NC</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => projectId && navigate(`/pqm/nc-management/${projectId}/config`)}
          >
            <div className="p-2 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Configuration</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => window.print()}
          >
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Print Report</span>
          </button>
          <button 
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 transition-colors text-left"
            onClick={() => navigate(projectId ? `/pqm/nc-management/${projectId}/nc?export=true` : `/pqm/nc-management/nc?export=true`)}
          >
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Export Data</span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

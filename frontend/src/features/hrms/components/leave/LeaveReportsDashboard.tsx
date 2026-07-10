import { useTranslation } from 'react-i18next';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';

export const LeaveReportsDashboard: React.FC = () => {
  const { t } = useTranslation();
  // Mock data for the 4 key reports requested by the user

  const utilizationData = [
    { department: 'Engineering', consumed: 450, remaining: 1200 },
    { department: 'Sales', consumed: 320, remaining: 800 },
    { department: 'Marketing', consumed: 180, remaining: 400 },
    { department: 'HR', consumed: 90, remaining: 250 },
  ];

  const trendData = [
    { month: 'Jan', applied: 45, approved: 40, rejected: 2, cancelled: 3 },
    { month: 'Feb', applied: 52, approved: 48, rejected: 1, cancelled: 3 },
    { month: 'Mar', applied: 61, approved: 55, rejected: 4, cancelled: 2 },
    { month: 'Apr', applied: 48, approved: 45, rejected: 1, cancelled: 2 },
    { month: 'May', applied: 85, approved: 78, rejected: 5, cancelled: 2 },
    { month: 'Jun', applied: 95, approved: 88, rejected: 3, cancelled: 4 },
  ];

  const liabilityData = [
    { type: 'Annual Leave', days: 2450, estValue: '$490,000' },
    { type: 'Sick Leave', days: 1200, estValue: '$0 (Non-encashable)' },
    { type: 'Comp Off', days: 45, estValue: '$9,000' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('auto.leave_analytics_reports', 'Leave Analytics & Reports')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auto.enterprise_leave_utilization_and_payroll_metrics', 'Enterprise leave utilization and payroll metrics')}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all">
          <Download className="w-4 h-4" />
          {t('auto.export_all_csv', 'Export All (CSV)')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Report */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('auto.leave_utilization_by_department', 'Leave Utilization by Department')}</h2>
            <button className="text-gray-400 hover:text-indigo-600 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar dataKey="consumed" name="Consumed Days" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="remaining" name="Remaining Days" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Report */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('auto.leave_application_trend_6_months', 'Leave Application Trend (6 Months)')}</h2>
            <button className="text-gray-400 hover:text-indigo-600 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Line type="monotone" dataKey="applied" name="Applied" stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} />
                <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liability Report */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('auto.financial_liability_accrued_balances', 'Financial Liability (Accrued Balances)')}</h2>
            <button className="text-gray-400 hover:text-indigo-600 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('auto.leave_type', 'Leave Type')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('auto.total_accrued_days', 'Total Accrued Days')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('auto.estimated_liability', 'Estimated Liability')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liabilityData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.type}</td>
                    <td className="px-4 py-3 text-right">{row.days}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{row.estValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOP Report for Payroll */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('auto.loss_of_pay_lop_for_current_month', 'Loss of Pay (LOP) for Current Month')}</h2>
            <button className="text-gray-400 hover:text-indigo-600 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-red-50/50 border border-red-100 border-dashed rounded-xl">
            <span className="text-4xl font-bold text-red-600">124</span>
            <span className="text-sm font-medium text-red-800 mt-2">{t('auto.total_lop_days_across_org', 'Total LOP Days across org')}</span>
            <button className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              {t('auto.view_employee_breakdown', 'View Employee Breakdown →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

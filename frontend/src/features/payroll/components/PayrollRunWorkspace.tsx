import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Play, CheckCircle, Clock, AlertTriangle, Download, X } from 'lucide-react';
import { usePayrollRuns, useGeneratePayroll } from '../api/usePayroll';

import { formatIST } from '@/utils/date';

export const PayrollRunWorkspace = () => {
  const { t } = useTranslation();
  const { data: runs, isLoading } = usePayrollRuns();
  const generatePayroll = useGeneratePayroll();
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleGenerate = async () => {
    try {
      await generatePayroll.mutateAsync({ month: selectedMonth, year: selectedYear });
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate payroll.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PROCESSED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> {t('auto.processed', 'Processed')}</span>;
      case 'PROCESSING': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-4 h-4 mr-1" /> {t('auto.processing', 'Processing')}</span>;
      case 'FAILED': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-4 h-4 mr-1" /> {t('auto.failed', 'Failed')}</span>;
      default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoading) return <div>{t('auto.loading_payroll_runs', 'Loading payroll runs...')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{t('auto.payroll_runs', 'Payroll Runs')}</h2>
          <p className="text-sm text-gray-500">{t('auto.manage_and_execute_monthly_payroll_computations', 'Manage and execute monthly payroll computations.')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Play className="w-4 h-4 mr-2" />
          {t('auto.run_payroll', 'Run Payroll')}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {runs?.map((run: any) => (
            <li key={run.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {formatIST(new Date(run.year, run.month - 1), 'MMMM yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('auto.computed_on', 'Computed on')} {formatIST(run.created_at, 'PPP')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getStatusBadge(run.status)}
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      {t('auto.total_net', 'Total Net: ₹')}{run.total_net}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">{t('auto.employees', 'Employees')}</p>
                    <p className="text-sm font-medium text-gray-900">{run.total_employees}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('auto.gross_payout', 'Gross Payout')}</p>
                    <p className="text-sm font-medium text-gray-900">₹{run.total_gross}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('auto.statutory_deductions', 'Statutory & Deductions')}</p>
                    <p className="text-sm font-medium text-gray-900">₹{run.total_deductions}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {(!runs || runs.length === 0) && (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">
              {t('auto.no_payroll_runs_found', 'No payroll runs found.')}
            </li>
          )}
        </ul>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('auto.generate_payroll_run', 'Generate Payroll Run')}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t('auto.this_will_lock_attendance_for_the_selected_month_a', 'This will lock attendance for the selected month and generate payslips for all active employees. This process cannot be automatically reversed.')}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('auto.month', 'Month')}</label>
                  <select 
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{formatIST(new Date(2024, i), 'MMMM')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('auto.year', 'Year')}</label>
                  <select 
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                {t('auto.cancel', 'Cancel')}
              </button>
              <button 
                onClick={handleGenerate}
                disabled={generatePayroll.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {generatePayroll.isPending ? 'Generating...' : 'Confirm Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

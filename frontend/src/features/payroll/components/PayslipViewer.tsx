import { useTranslation } from 'react-i18next';
import React from 'react';
import { usePayslips } from '../api/usePayroll';
import { Download, Printer } from 'lucide-react';

import { formatIST } from '@/utils/date';

export const PayslipViewer = () => {
  const { t } = useTranslation();
  const { data: payslips, isLoading } = usePayslips(undefined, true);

  if (isLoading) return <div>{t('auto.loading_payslips', 'Loading payslips...')}</div>;
  if (!payslips || payslips.length === 0) return <div className="text-gray-500 text-center py-8">{t('auto.no_payslips_generated_yet', 'No payslips generated yet.')}</div>;

  // Render the most recent payslip by default
  const payslip = payslips[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{t('auto.payslip', 'Payslip -')} {formatIST(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}</h2>
          <p className="text-sm text-gray-500">{t('auto.employee_id', 'Employee ID:')} {payslip.employee_code}</p>
        </div>
        <div className="space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Printer className="w-4 h-4 mr-2" /> {t('auto.print', 'Print')}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" /> {t('auto.download_pdf', 'Download PDF')}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-xl sm:rounded-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('auto.yss_orbit', 'YSS Orbit')}</h1>
            <p className="text-sm text-gray-500">{t('auto.payslip_for_the_month_of', 'Payslip for the month of')} {formatIST(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{payslip.employee_name}</p>
            <p className="text-sm text-gray-500">{t('auto.emp_code', 'Emp Code:')} {payslip.employee_code}</p>
          </div>
        </div>

        {/* Summary Info */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('auto.working_days', 'Working Days')}</p>
            <p className="text-sm font-medium text-gray-900">{payslip.working_days}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('auto.paid_days', 'Paid Days')}</p>
            <p className="text-sm font-medium text-gray-900">{payslip.paid_days}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('auto.lop_days', 'LOP Days')}</p>
            <p className="text-sm font-medium text-red-600">{payslip.lop_days}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('auto.payment_mode', 'Payment Mode')}</p>
            <p className="text-sm font-medium text-gray-900">{payslip.payment_mode.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-200">
          {/* Earnings */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">{t('auto.earnings', 'Earnings')}</h3>
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-100">
                {Object.entries(payslip.earnings_breakdown || {}).map(([code, amount]) => (
                  <tr key={code}>
                    <td className="py-3 text-sm text-gray-600 font-medium">{code}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">₹{amount as string}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-4 text-sm font-bold text-gray-900">{t('auto.total_earnings_a', 'Total Earnings (A)')}</td>
                  <td className="py-4 text-sm font-bold text-gray-900 text-right">₹{payslip.total_earnings}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">{t('auto.deductions', 'Deductions')}</h3>
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-100">
                {Object.entries(payslip.deductions_breakdown || {}).map(([code, amount]) => (
                  <tr key={code}>
                    <td className="py-3 text-sm text-gray-600 font-medium">{code.replace('_', ' ')}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">₹{amount as string}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-4 text-sm font-bold text-gray-900">{t('auto.total_deductions_b', 'Total Deductions (B)')}</td>
                  <td className="py-4 text-sm font-bold text-gray-900 text-right">₹{payslip.total_deductions}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Net Salary Footer */}
        <div className="bg-indigo-50 px-6 py-6 border-t border-indigo-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-indigo-900">{t('auto.net_salary_a_b', 'Net Salary (A - B)')}</h3>
            <p className="text-sm text-indigo-700">{t('auto.amount_transferred_to_bank', 'Amount transferred to bank')}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-indigo-700">₹{payslip.net_salary}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

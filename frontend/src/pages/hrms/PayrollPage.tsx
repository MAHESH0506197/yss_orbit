import React from 'react';
import { Card } from '@/components/ui/Card';
import { PayrollRunWorkspace } from '@/features/payroll/components/PayrollRunWorkspace';
import { PayrollSettingsDashboard } from '@/features/payroll/components/PayrollSettingsDashboard';
import { PayslipViewer } from '@/features/payroll/components/PayslipViewer';
import { Calculator, Settings, FileText, BarChart2, ShieldCheck, List } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLocation, useNavigate } from 'react-router-dom';

type PayrollTab = 'run' | 'structures' | 'payslips' | 'it-declarations' | 'reports' | 'compliance';

/** Derive active tab from the URL path segment after /hrms/payroll */
function deriveTab(pathname: string): PayrollTab {
  const seg = pathname.split('/hrms/payroll')[1]?.replace(/^\//, '') || '';
  if (seg === 'structures')      return 'structures';
  if (seg === 'payslips')        return 'payslips';
  if (seg === 'it-declarations') return 'it-declarations';
  if (seg === 'reports')         return 'reports';
  if (seg === 'compliance')      return 'compliance';
  return 'run';
}

export const PayrollPage = () => {
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
  const location     = useLocation();
  const navigate     = useNavigate();
  const activeTab    = deriveTab(location.pathname);

  const isAdmin = isSuperAdmin;

  const setTab = (tab: PayrollTab) => {
    const base = '/hrms/payroll';
    navigate(tab === 'run' ? base : `${base}/${tab}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll Engine</h1>
        <p className="mt-1 text-sm text-gray-500">Enterprise salary computation, statutory compliance, and payslip generation.</p>
      </div>

      <div className="mt-6 mb-8">
        {/* Mobile select */}
        <div className="sm:hidden">
          <select
            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            value={activeTab}
            onChange={(e) => setTab(e.target.value as PayrollTab)}
          >
            {isAdmin && <option value="run">Payroll Run Workspace</option>}
            {isAdmin && <option value="structures">Salary Structures</option>}
            {isAdmin && <option value="it-declarations">IT Declarations</option>}
            {isAdmin && <option value="reports">Reports</option>}
            {isAdmin && <option value="compliance">Compliance</option>}
            <option value="payslips">Payslips</option>
          </select>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden sm:block">
          <nav className="flex flex-wrap gap-1" aria-label="Payroll Tabs">
            {isAdmin && (
              <>
                <button
                  onClick={() => setTab('run')}
                  className={`${
                    activeTab === 'run'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Payroll Run
                </button>

                <button
                  onClick={() => setTab('structures')}
                  className={`${
                    activeTab === 'structures'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
                >
                  <List className="w-4 h-4 mr-2" />
                  Salary Structures
                </button>

                <button
                  onClick={() => setTab('it-declarations')}
                  className={`${
                    activeTab === 'it-declarations'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  IT Declarations
                </button>

                <button
                  onClick={() => setTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Reports
                </button>

                <button
                  onClick={() => setTab('compliance')}
                  className={`${
                    activeTab === 'compliance'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Compliance
                </button>
              </>
            )}

            <button
              onClick={() => setTab('payslips')}
              className={`${
                activeTab === 'payslips'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              } px-3 py-2 font-medium text-sm rounded-md flex items-center`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Payslips
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'run'            && isAdmin && <PayrollRunWorkspace />}
        {activeTab === 'structures'     && isAdmin && <PayrollSettingsDashboard />}
        {activeTab === 'it-declarations'&& isAdmin && <PayrollSettingsDashboard />}
        {activeTab === 'reports'        && isAdmin && <PayrollSettingsDashboard />}
        {activeTab === 'compliance'     && isAdmin && <PayrollSettingsDashboard />}
        {activeTab === 'payslips'               && <PayslipViewer />}
      </div>
    </div>
  );
};


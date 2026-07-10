import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';

export const PayrollReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('auto.payroll_reports', 'Payroll Reports')}</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <button 
          onClick={() => setGenerating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg"
        >
          <FileText className="w-4 h-4" />
          {generating ? t('auto.generating', 'Generating...') : t('auto.generate_report', 'Generate Report')}
        </button>
      </div>
    </div>
  );
};

export default PayrollReportsPage;

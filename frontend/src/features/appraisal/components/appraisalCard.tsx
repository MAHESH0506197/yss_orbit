import React from 'react';
import { useTranslation } from 'react-i18next';

export const AppraisalCard: React.FC<{ appraisal: any }> = ({ appraisal }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800">{appraisal.employeeName}</h3>
      <p className="text-sm text-gray-500">{t('auto.period', 'Period:')} {appraisal.period}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${appraisal.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {appraisal.status}
        </span>
        <span className="text-sm font-semibold text-[var(--primary-color)]">{t('auto.score', 'Score:')} {appraisal.score}/5</span>
      </div>
    </div>
  );
};

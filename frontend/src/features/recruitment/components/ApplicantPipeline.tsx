import React from 'react';
import { useTranslation } from 'react-i18next';

export const ApplicantPipeline: React.FC<{ applicants: any[] }> = ({ applicants }) => {
  const { t } = useTranslation();
  const stages = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => (
        <div key={stage} className="w-64 bg-gray-50 rounded-lg p-4 flex-shrink-0 border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4">{stage}</h3>
          <div className="space-y-2">
            {applicants.filter(a => a.stage === stage).map(applicant => (
              <div key={applicant.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 text-sm">
                <div className="font-medium text-gray-900">{applicant.name}</div>
                <div className="text-gray-500 text-xs mt-1">{t('auto.applied', 'Applied:')} {applicant.date}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

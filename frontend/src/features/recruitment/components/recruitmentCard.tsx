import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatIST } from '@/utils/date';

export const RecruitmentCard: React.FC<{ job: any }> = ({ job }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{job.title}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {job.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{t('auto.dept', 'Dept:')} {job.department}</p>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{t('auto.applicants', 'Applicants:')} {job.applicantCount}</span>
        <span>{t('auto.posted', 'Posted:')} {formatIST(new Date(job.createdAt), 'PPP')}</span>
      </div>
    </div>
  );
};

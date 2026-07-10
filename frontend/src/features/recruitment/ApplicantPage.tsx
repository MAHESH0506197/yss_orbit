import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\ApplicantPage.tsx
import React from 'react';
import { ApplicantPipeline } from './components/ApplicantPipeline';

export const ApplicantPage: React.FC = () => {
  const { t } = useTranslation();
  const dummyApplicants = [
    { id: 1, name: 'Alice Smith', stage: 'New', date: '2023-10-01' },
    { id: 2, name: 'Bob Jones', stage: 'Interview', date: '2023-09-28' },
    { id: 3, name: 'Charlie Brown', stage: 'Offer', date: '2023-09-15' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.applicant_pipeline', 'Applicant Pipeline')}</h1>
      <ApplicantPipeline applicants={dummyApplicants} />
    </div>
  );
};

import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\JobPostingPage.tsx
import React from 'react';
import { JobPostingForm } from './components/JobPostingForm';

export const JobPostingPage: React.FC = () => {
  const { t } = useTranslation();
  const handleSubmit = (data: any) => {
    console.log('New Job', data);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.create_job_posting', 'Create Job Posting')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <JobPostingForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

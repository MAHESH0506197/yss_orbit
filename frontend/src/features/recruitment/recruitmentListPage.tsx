import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\recruitmentListPage.tsx
import React, { useEffect, useState } from 'react';
import { RecruitmentCard } from './components/recruitmentCard';
import { useRecruitment } from './hooks/userecruitment';
import { Link } from 'react-router-dom';

export const RecruitmentListPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading } = useRecruitment();
  const jobs = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('auto.recruitment_dashboard', 'Recruitment Dashboard')}</h1>
        <div className="space-x-4">
          <Link to="postings/new" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">{t('auto.new_job', 'New Job')}</Link>
          <Link to="applicants" className="text-[var(--primary-color)] hover:underline">{t('auto.view_applicants', 'View Applicants')}</Link>
        </div>
      </div>
      
      {loading ? (
        <p>{t('auto.loading', 'Loading...')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <RecruitmentCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

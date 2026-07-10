import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\recruitmentDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const RecruitmentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.job_applicant_detail', 'Job/Applicant Detail:')} {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>{t('auto.detailed_view_of_a_recruitment_entity', 'Detailed view of a recruitment entity.')}</p>
      </div>
    </div>
  );
};

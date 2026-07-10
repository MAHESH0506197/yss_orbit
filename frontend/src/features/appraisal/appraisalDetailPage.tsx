import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\pages\appraisalDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const AppraisalDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('auto.appraisal_details', 'Appraisal Details:')} {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>{t('auto.loading_full_review_details', 'Loading full review details...')}</p>
      </div>
    </div>
  );
};

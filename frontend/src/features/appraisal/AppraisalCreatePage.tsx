import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\pages\AppraisalCreatePage.tsx
import React from 'react';
import { AppraisalForm } from './components/AppraisalForm';

export const AppraisalCreatePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('auto.create_new_appraisal', 'Create New Appraisal')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <AppraisalForm />
      </div>
    </div>
  );
};

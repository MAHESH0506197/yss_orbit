import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\appraisal\components\AppraisalForm.tsx
import React from 'react';

export const AppraisalForm: React.FC = () => {
  const { t } = useTranslation();
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.employee_comments', 'Employee Comments')}</label>
        <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows={4}></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.manager_rating_1_5', 'Manager Rating (1-5)')}</label>
        <input type="number" min="1" max="5" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <button type="button" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md">{t('auto.save_appraisal', 'Save Appraisal')}</button>
    </form>
  );
};

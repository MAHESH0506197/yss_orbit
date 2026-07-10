import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\modules\recruitment\pages\OfferPage.tsx
import React from 'react';

export const OfferPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('auto.offer_management', 'Offer Management')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p>{t('auto.draft_and_send_offer_letters_to_successful_candida', 'Draft and send offer letters to successful candidates.')}</p>
      </div>
    </div>
  );
};

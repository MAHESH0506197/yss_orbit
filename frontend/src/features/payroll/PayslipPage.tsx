import { useTranslation } from 'react-i18next';
﻿// yss_orbit\frontend\src\modules\payroll\pages\PayslipPage.tsx
import React from 'react';
import { PayslipViewer } from '@/features/payroll/components/PayslipViewer';
import { useParams } from 'react-router-dom';

export const PayslipPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  
return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">{t('auto.payslip_view', 'Payslip View')} {id ? `(${id})` : ''}</h1>
      <PayslipViewer />
    </div>
  );
};


import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { AppRouter } from '@/routes/AppRouter';

import { useAuthStore } from '@/store/authStore';
import { OfflineBanner } from '@/components/platform/OfflineBanner';

// M-1 fix: Toaster is defined in main.tsx (canonical, fully styled).
// Removed duplicate Toaster from this component — double Toaster = doubled toasts.

function App() {
  const { i18n } = useTranslation();
  const language = useAuthStore((s: any) => s.language);

  // Dynamically change language when user's store language changes
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return (
    <GlobalErrorBoundary>
      <OfflineBanner />
      <AppRouter />
    </GlobalErrorBoundary>
  );
}

export default App;
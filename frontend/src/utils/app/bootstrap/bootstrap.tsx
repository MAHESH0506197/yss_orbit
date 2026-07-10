// yss_orbit\frontend\src\app\bootstrap\bootstrap.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
// @ts-expect-error - Auto-patched TS2307
import { AppProviders } from '../providers/AppProviders';
import { BrowserRouter } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { AppRouter } from '../router/AppRouter';
import '../../assets/styles/global.css';

export const bootstrap = () => {
  const container = document.getElementById('root');
  if (!container) throw new Error('Failed to find the root element');
  
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
    </React.StrictMode>
  );
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import { AppProviders } from '@/routes/providers/AppProviders'; // H-6 fix: mount real provider stack
import { ThemeProvider } from '@/utils/theme/ThemeProvider';
import i18n from './i18n';
import './styles/globals.css';

// ---------------------------------------------------------------------------
// TanStack Query Client — production-tuned
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes stale time
      gcTime: 10 * 60 * 1000,          // 10 minutes cache time
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,        // Don't refetch on every tab switch
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Never retry mutations automatically
    },
  },
});

// ---------------------------------------------------------------------------
// Root Render
// ---------------------------------------------------------------------------
const root = document.getElementById('root');
if (!root) throw new Error('[YSS Orbit] Root element #root not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            {/* H-6 fix: AppProviders was never mounted — now wraps App with full real provider stack */}
            <AppProviders>
              <App />
            </AppProviders>
            <Toaster
              position="top-right"
              gutter={12}
              containerStyle={{ top: 24, right: 24 }}
              toastOptions={{
                duration: 5000,
                style: {
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                  letterSpacing: '0.01em',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981', // vibrant emerald
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444', // vibrant red
                    secondary: '#ffffff',
                  },
                  duration: 6000,
                },
              }}
            />
          </I18nextProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

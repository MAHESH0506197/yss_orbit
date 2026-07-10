// yss_orbit\frontend\src\app\providers\BrandingProvider.tsx
import React, { useEffect, useState } from 'react';
import { BrandingContext, PublicTenantConfig } from '@/utils/core/branding/brandingContext';
import { fetchPublicTenantConfig } from '@/features/platform/branding/api/brandingApi';

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicTenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const data = await fetchPublicTenantConfig();
        
        if (isMounted) {
          setConfig(data);

        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load branding config:", err);
          setError('Failed to load branding configuration.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <style>{`@keyframes bp-spin { to { transform: rotate(360deg); } }`}</style>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" style={{ animation: 'bp-spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  return (
    <BrandingContext.Provider value={{ config, isLoading, error }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingProvider;

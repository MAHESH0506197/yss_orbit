// yss_orbit\frontend\src\layouts\error\ModuleNotAvailablePage.tsx
import React from 'react';

interface ModuleNotAvailablePageProps {
  className?: string;
  children?: React.ReactNode;
}

export const ModuleNotAvailablePage: React.FC<ModuleNotAvailablePageProps> = ({ className = '', children }) => {
  return (
    <div className={`modulenotavailablepage ${className}`}>
      {children || <span>ModuleNotAvailablePage Component</span>}
    </div>
  );
};

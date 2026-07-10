// yss_orbit\frontend\src\layouts\error\ErrorLayout.tsx
import React from 'react';

interface ErrorLayoutProps {
  children?: React.ReactNode;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">{children}</main>
    </div>
  );
};

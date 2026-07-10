// yss_orbit\frontend\src\components\branding\WhitelabelWrapper.tsx
import React from 'react';

interface WhitelabelWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

export const WhitelabelWrapper: React.FC<WhitelabelWrapperProps> = ({ className = '', children }) => {
  return (
    <div className={`whitelabelwrapper ${className}`}>
      {children || <span>WhitelabelWrapper Component</span>}
    </div>
  );
};

// yss_orbit\frontend\src\components\auth\SessionGate.tsx
import React from 'react';

interface SessionGateProps {
  className?: string;
  children?: React.ReactNode;
}

export const SessionGate: React.FC<SessionGateProps> = ({ className = '', children }) => {
  return (
    <div className={`sessiongate ${className}`}>
      {children || <span>SessionGate Component</span>}
    </div>
  );
};

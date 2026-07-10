// yss_orbit\frontend\src\components\auth\MfaChallenge.tsx
import React from 'react';

interface MfaChallengeProps {
  className?: string;
  children?: React.ReactNode;
}

export const MfaChallenge: React.FC<MfaChallengeProps> = ({ className = '', children }) => {
  return (
    <div className={`mfachallenge ${className}`}>
      {children || <span>MfaChallenge Component</span>}
    </div>
  );
};

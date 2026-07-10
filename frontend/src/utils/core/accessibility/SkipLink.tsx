// yss_orbit\frontend\src\core\accessibility\SkipLink.tsx
import React from 'react';

interface SkipLinkProps {
  targetId: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:font-bold focus:shadow-lg focus:rounded-md"
    >
      Skip to main content
    </a>
  );
};

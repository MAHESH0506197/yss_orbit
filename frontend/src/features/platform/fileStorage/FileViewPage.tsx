// yss_orbit\frontend\src\modules\fileStorage\pages\FileViewPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const FileViewPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Preview: {id}</h1>
      <div className="bg-gray-100 p-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">File preview will appear here.</p>
      </div>
    </div>
  );
};

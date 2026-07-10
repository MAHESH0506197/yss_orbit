// yss_orbit\frontend\src\modules\fileStorage\pages\FileUploadPage.tsx
import React from 'react';
import { UploadDropzone } from './components/UploadDropzone';
import { useNavigate } from 'react-router-dom';

export const FileUploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/admin/files');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Upload File</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <UploadDropzone onUploadComplete={handleUploadComplete} />
      </div>
    </div>
  );
};

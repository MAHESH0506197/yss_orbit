// yss_orbit\frontend\src\modules\fileStorage\components\UploadDropzone.tsx
import React, { useCallback } from 'react';
import { useFileStorage } from '../hooks/usefileStorage';

export const UploadDropzone: React.FC<{ onUploadComplete?: () => void }> = ({ onUploadComplete }) => {
  const { uploadFile, uploading } = useFileStorage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadFile(file);
        if (onUploadComplete) onUploadComplete();
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors relative">
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleFileChange}
        disabled={uploading}
      />
      <div className="text-gray-500 mb-2">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--primary-color)]">
        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
      </p>
      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
    </div>
  );
};

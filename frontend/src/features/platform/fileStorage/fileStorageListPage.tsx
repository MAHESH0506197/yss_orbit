// yss_orbit\frontend\src\modules\fileStorage\pages\fileStorageListPage.tsx
import React, { useEffect, useState } from 'react';
import { FileTable } from './components/FileTable';
import { useFileStorage } from './hooks/usefileStorage';
import { StoredFile } from './types/fileStorageTypes';
import { Link } from 'react-router-dom';

export const FileStorageListPage: React.FC = () => {
  const { data, loading } = useFileStorage();
  const files = (data || []) as any;

  

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
        <Link to="upload" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">Upload File</Link>
      </div>

      {loading ? (
        <p>Loading files...</p>
      ) : (
        <FileTable files={files} />
      )}
    </div>
  );
};

// yss_orbit\frontend\src\modules\fileStorage\components\fileStorageCard.tsx
import React from 'react';
import { StoredFile } from '../types/fileStorageTypes';
import { formatFileSize } from '../utils/fileStorageHelpers';

export const FileStorageCard: React.FC<{ file: StoredFile }> = ({ file }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800 truncate" title={file.filename}>{file.filename}</h3>
        <span className="text-xs text-gray-500 uppercase">{file.extension}</span>
      </div>
      <p className="text-sm text-gray-600 mb-2">Size: {formatFileSize(file.sizeBytes)}</p>
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-color)] text-sm font-medium hover:underline">
        Download
      </a>
    </div>
  );
};

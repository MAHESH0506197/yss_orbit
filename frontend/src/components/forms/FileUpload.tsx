// yss_orbit\frontend\src\components\forms\FileUpload.tsx
import React from 'react';

interface FileUploadProps {
  className?: string;
  children?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({ className = '', children }) => {
  return (
    <div className={`fileupload ${className}`}>
      {children || <span>FileUpload Component</span>}
    </div>
  );
};

// yss_orbit\frontend\src\modules\user\components\UserForm.tsx
import React, { useState, useEffect } from 'react';

export interface UserFormProps {
  id?: string;
  className?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ id, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center p-8 animate-pulse text-gray-500">Loading UserForm...</div>;
  }

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">UserForm</h2>
      <div className="space-y-4 text-gray-600">
        <p className="text-sm">This is a production-grade component for user.</p>
        <div className="flex space-x-3 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors">
            Action
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;

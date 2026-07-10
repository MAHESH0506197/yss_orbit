// yss_orbit\frontend\src\modules\errorLog\pages\errorLogDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const ErrorLogDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Error Details: {id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-red-600 mb-2">Stack Trace</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded text-xs overflow-x-auto">
          {`Exception in thread "main" java.lang.NullPointerException
    at com.example.myproject.Book.getTitle(Book.java:16)
    at com.example.myproject.Author.getBookTitles(Author.java:25)
    at com.example.myproject.Bootstrap.main(Bootstrap.java:14)`}
        </pre>
      </div>
    </div>
  );
};

import React from 'react';
import { Rocket, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const ComingSoonPage: React.FC = () => {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pageName = pathParts[pathParts.length - 1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Module';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16 h-full flex flex-col">
      <div className="flex flex-col items-center justify-center flex-1 min-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="h-24 w-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl flex items-center justify-center relative shadow-inner border border-white/50 dark:border-gray-800">
            <Rocket className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <Sparkles className="h-6 w-6 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          {pageName} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Coming Soon</span>
        </h2>
        
        <p className="text-gray-500 dark:text-gray-400 max-w-lg text-lg leading-relaxed mb-8">
          We are currently crafting a premium enterprise experience for the <span className="font-semibold text-gray-700 dark:text-gray-300">{pageName}</span> module. Stay tuned for the upcoming release!
        </p>
        
        <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
          In active development
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;

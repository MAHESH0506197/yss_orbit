// yss_orbit\frontend\src\modules\tenantSettings\components\SettingsForm.tsx
import React, { useState } from 'react';
import { Save, Loader2, Globe, Clock, CalendarDays } from 'lucide-react';

export const SettingsForm: React.FC<{ initialData?: any, onSubmit: (data: any) => void }> = ({ initialData, onSubmit }) => {
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [timezone, setTimezone] = useState(initialData?.timezone || 'UTC');
  const [dateFormat, setDateFormat] = useState(initialData?.dateFormat || 'YYYY-MM-DD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({ currency, timezone, dateFormat });
      setIsSubmitting(false);
    }, 500);
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-indigo-500 appearance-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      
      
      
      <div className="space-y-1.5 transition-transform duration-200 focus-within:translate-x-0.5">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Date Format</label>
        <div className="relative">
          <CalendarDays className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className={`${inputCls} pl-10`}>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </div>
      </div>
      
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0 dark:ring-offset-gray-950"
        >
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </form>
  );
};

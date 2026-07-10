import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const JobPostingForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, department, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.job_title', 'Job Title')}</label>
        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.department', 'Department')}</label>
        <input type="text" required value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.job_description', 'Job Description')}</label>
        <textarea required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows={4}></textarea>
      </div>
      <button type="submit" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium">{t('auto.create_job_posting', 'Create Job Posting')}</button>
    </form>
  );
};

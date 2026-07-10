import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const InterviewScheduler: React.FC<{ onSchedule: (data: any) => void }> = ({ onSchedule }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [interviewer, setInterviewer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({ date, time, interviewer });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.date', 'Date')}</label>
        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.time', 'Time')}</label>
        <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auto.interviewer_id_name', 'Interviewer ID / Name')}</label>
        <input type="text" required value={interviewer} onChange={e => setInterviewer(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
      </div>
      <button type="submit" className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium w-full">{t('auto.schedule_interview', 'Schedule Interview')}</button>
    </form>
  );
};

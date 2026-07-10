// yss_orbit\frontend\src\modules\audit\components\AuditTimeline.tsx
import React from 'react';
import { AuditLog } from '../types/auditTypes';
import { formatIST } from '@/utils/date';

export const AuditTimeline: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {logs.map((log, idx) => (
        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
            <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v5H9V5zm0 6h2v2H9v-2z" /></svg>
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-900">{log.action}</span>
              <time className="font-caveat font-medium text-slate-500 text-sm">{formatIST(new Date(log.timestamp), 'PP pp')}</time>
            </div>
            <div className="text-slate-500 text-sm">{log.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

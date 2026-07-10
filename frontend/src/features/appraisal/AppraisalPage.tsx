import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\appraisal\pages\AppraisalPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Appraisal {
  id: string;
  employeeName: string;
  department: string;
  score: number | null;
  status: 'pending' | 'completed' | 'rejected';
  dueDate: string;
}

const mockAppraisals: Appraisal[] = [
  { id: '1', employeeName: 'Alice Johnson', department: 'Engineering', score: 4.5, status: 'completed', dueDate: '2026-05-15' },
  { id: '2', employeeName: 'Bob Smith', department: 'Sales', score: null, status: 'pending', dueDate: '2026-06-01' },
  { id: '3', employeeName: 'Charlie Brown', department: 'Marketing', score: 2.5, status: 'rejected', dueDate: '2026-05-20' },
];

const fetchAppraisals = async (): Promise<Appraisal[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockAppraisals), 800));
};

export default function AppraisalPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  
  const { data: appraisals, isLoading } = useQuery({
    queryKey: ['appraisals'],
    queryFn: fetchAppraisals,
  });

  const filteredAppraisals = appraisals?.filter(a => a.employeeName.toLowerCase().includes(search.toLowerCase())) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-[var(--color-success)]" />;
      case 'pending': return <Clock size={14} className="text-[var(--color-warning)]" />;
      case 'rejected': return <XCircle size={14} className="text-[var(--color-error)]" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[var(--color-success-light)] text-[var(--color-success)]';
      case 'pending': return 'bg-[var(--color-warning-light)] text-[var(--color-warning)]';
      case 'rejected': return 'bg-[var(--color-error-light)] text-[var(--color-error)]';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="text-[length:var(--font-size-2xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">{t('auto.performance_appraisals', 'Performance Appraisals')}</h1>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
            {t('auto.manage_employee_reviews_and_performance_tracking', 'Manage employee reviews and performance tracking.')}
          </p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={16} />}>
          {t('auto.new_review_cycle', 'New Review Cycle')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)]">
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.completed_reviews', 'Completed Reviews')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">24</div>
        </Card>
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.pending_reviews', 'Pending Reviews')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-warning)]">12</div>
        </Card>
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.company_average', 'Company Average')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-primary)]">4.2/5</div>
        </Card>
      </div>

      <Card variant="elevated" noPadding>
        <div className="p-[var(--space-4)] border-b border-[var(--color-border)] flex items-center gap-[var(--space-4)] bg-[var(--color-surface)]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('auto.search_employee', 'Search employee...')}
              className="pl-[var(--space-10)] w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[length:var(--font-size-sm)] text-[var(--color-text)]">
            <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{t('auto.employee', 'Employee')}</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{t('auto.department', 'Department')}</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{t('auto.score', 'Score')}</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{t('auto.status', 'Status')}</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{t('auto.due_date', 'Due Date')}</th>
                <th className="p-[var(--space-4)] font-[number:var(--font-weight-medium)] text-right">{t('auto.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {isLoading && (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-32 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-24 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-12 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-20 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-24 bg-[var(--color-surface-hover)] animate-pulse rounded" /></td>
                    <td className="p-[var(--space-4)]"><div className="h-4 w-16 bg-[var(--color-surface-hover)] animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              )}

              {!isLoading && filteredAppraisals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-[var(--space-8)] text-center text-[var(--color-text-muted)]">
                    {t('auto.no_appraisals_found', 'No appraisals found.')}
                  </td>
                </tr>
              )}

              {!isLoading && filteredAppraisals.map((appraisal) => (
                <tr key={appraisal.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{appraisal.employeeName}</td>
                  <td className="p-[var(--space-4)] text-[var(--color-text-secondary)]">{appraisal.department}</td>
                  <td className="p-[var(--space-4)] font-[number:var(--font-weight-medium)]">{appraisal.score ? `${appraisal.score}/5` : '-'}</td>
                  <td className="p-[var(--space-4)]">
                    <span className={`px-[var(--space-2)] py-[var(--space-1)] rounded-full text-[length:var(--font-size-xs)] flex items-center gap-[var(--space-1)] w-max ${getStatusClass(appraisal.status)}`}>
                      {getStatusIcon(appraisal.status)}
                      <span className="capitalize">{appraisal.status}</span>
                    </span>
                  </td>
                  <td className="p-[var(--space-4)] text-[var(--color-text-secondary)]">{appraisal.dueDate}</td>
                  <td className="p-[var(--space-4)] text-right">
                    <Button variant="outline" size="sm">
                      {appraisal.status === 'pending' ? 'Review' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

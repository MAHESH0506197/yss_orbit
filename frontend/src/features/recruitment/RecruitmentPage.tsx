import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\recruitment\pages\RecruitmentPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Users, Search, MoreVertical, Briefcase, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  applicantsCount: number;
  status: 'published' | 'draft' | 'closed';
  postedAt: string;
}

const mockJobs: JobPosting[] = [
  { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', applicantsCount: 45, status: 'published', postedAt: '2026-05-10' },
  { id: '2', title: 'Product Manager', department: 'Product', location: 'New York, NY', applicantsCount: 12, status: 'published', postedAt: '2026-05-20' },
  { id: '3', title: 'Marketing Specialist', department: 'Marketing', location: 'London, UK', applicantsCount: 0, status: 'draft', postedAt: '-' },
  { id: '4', title: 'HR Director', department: 'Human Resources', location: 'San Francisco, CA', applicantsCount: 89, status: 'closed', postedAt: '2026-01-15' },
];

const fetchJobs = async (): Promise<JobPosting[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockJobs), 800));
};

export default function RecruitmentPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['recruitmentJobs'],
    queryFn: fetchJobs,
  });

  const filteredJobs = jobs?.filter(j => j.title.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-6)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)]">
        <div>
          <h1 className="text-[length:var(--font-size-2xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">{t('auto.recruitment', 'Recruitment')}</h1>
          <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)] mt-[var(--space-1)]">
            {t('auto.manage_job_postings_and_applicant_tracking', 'Manage job postings and applicant tracking.')}
          </p>
        </div>
        <Button variant="primary" iconLeft={<Plus size={16} />}>
          {t('auto.create_job_posting', 'Create Job Posting')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--space-4)]">
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.open_roles', 'Open Roles')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">8</div>
        </Card>
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.total_applicants', 'Total Applicants')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-primary)]">146</div>
        </Card>
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.interviews_scheduled', 'Interviews Scheduled')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-warning)]">12</div>
        </Card>
        <Card variant="elevated" bodyStyle={{ padding: 'var(--space-4)' }} className="flex flex-col gap-2">
          <div className="text-[var(--color-text-secondary)] text-[length:var(--font-size-sm)] font-[number:var(--font-weight-medium)]">{t('auto.offers_accepted', 'Offers Accepted')}</div>
          <div className="text-[length:var(--font-size-3xl)] font-[number:var(--font-weight-bold)] text-[var(--color-success)]">3</div>
        </Card>
      </div>

      <Card variant="elevated" noPadding>
        <div className="p-[var(--space-4)] border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)] bg-[var(--color-surface)]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('auto.search_jobs', 'Search jobs...')}
              className="pl-[var(--space-10)] w-full"
            />
          </div>
          <div className="flex items-center gap-[var(--space-2)]">
            <select className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-[length:var(--font-size-sm)] rounded-[var(--radius-md)] p-[var(--space-2)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none">
              <option value="all">{t('auto.all_departments', 'All Departments')}</option>
              <option value="engineering">{t('auto.engineering', 'Engineering')}</option>
              <option value="product">{t('auto.product', 'Product')}</option>
              <option value="marketing">{t('auto.marketing', 'Marketing')}</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {isLoading && (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-[var(--space-4)] flex items-center justify-between">
                <div className="flex flex-col gap-2 w-1/3">
                  <div className="h-5 w-full bg-[var(--color-surface-hover)] animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-[var(--color-surface-hover)] animate-pulse rounded" />
                </div>
                <div className="h-8 w-24 bg-[var(--color-surface-hover)] animate-pulse rounded" />
              </div>
            ))
          )}

          {!isLoading && filteredJobs.length === 0 && (
            <div className="p-[var(--space-8)] text-center text-[var(--color-text-muted)]">
              {t('auto.no_jobs_found_matching_your_criteria', 'No jobs found matching your criteria.')}
            </div>
          )}

          {!isLoading && filteredJobs.map((job) => (
            <div key={job.id} className="p-[var(--space-4)] flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-4)] hover:bg-[var(--color-surface-hover)] transition-colors">
              <div className="flex flex-col gap-[var(--space-1)]">
                <h3 className="text-[length:var(--font-size-md)] font-[number:var(--font-weight-semibold)] text-[var(--color-text)]">
                  {job.title}
                </h3>
                <div className="flex items-center gap-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-[var(--space-6)]">
                <div className="flex flex-col items-center">
                  <span className="text-[length:var(--font-size-lg)] font-[number:var(--font-weight-bold)] text-[var(--color-text)]">
                    {job.applicantsCount}
                  </span>
                  <span className="text-[length:var(--font-size-xs)] text-[var(--color-text-secondary)]">
                    {t('auto.applicants', 'Applicants')}
                  </span>
                </div>

                <div className="w-24">
                  <span className={`inline-flex items-center justify-center w-full px-[var(--space-2)] py-[var(--space-1)] rounded-full text-[length:var(--font-size-xs)] font-[number:var(--font-weight-medium)] ${
                    job.status === 'published' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' :
                    job.status === 'draft' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' :
                    'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'
                  }`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>

                <Button variant="ghost" size="sm" iconLeft={<MoreVertical size={16} />} aria-label="More options" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

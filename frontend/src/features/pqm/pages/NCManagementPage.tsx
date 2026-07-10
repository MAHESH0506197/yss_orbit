import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2, ShieldAlert,
  Search, X,
  ChevronLeft, ChevronRight, Loader2,
  ArrowRight
} from 'lucide-react';
import { useProjects } from '../api/useProjects';
import type { PQMProject } from '../types';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { EmptyState } from '@/components/platform/EmptyState';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { MapPin, Zap, Eye } from 'lucide-react';

const PAGE_SIZE = 20;

export const NCManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const p: Record<string, any> = { page, page_size: PAGE_SIZE, status: 'active', ordering: 'name' };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [page, debouncedSearch]);

  const { data, isLoading, isError, isFetching } = useProjects(queryParams);
  const projects: PQMProject[] = useMemo(() => data?.results ?? [], [data]);
  const meta = (data as any)?.meta ?? null;
  const totalPages = meta?.total_pages ?? 1;

  if (isLoading && page === 1) return <PageSkeleton />;
  if (isError) return <EmptyState icon={ShieldAlert} title="Failed to load workspaces" description="Please try again later." />;

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-[1600px] mx-auto h-[calc(100vh-theme(spacing.16))]">
      <PageHeader
        title="NC Management"
        subtitle="Select a project to enter its quality workspace"
        icon={ShieldAlert}
      />
      
      <RefetchBar visible={isFetching} />

      <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 transition-shadow"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-6 px-6 pb-6">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title={debouncedSearch ? "No matching projects" : "No active projects"}
            description={debouncedSearch ? "Try a different search term" : "Projects must be active to appear here"}
          />
        ) : (
          <CardGrid density="comfortable">
            {projects.map((proj, i) => (
              <div key={proj.id} style={{ animationDelay: `${i * 40}ms` }} className="flex flex-col h-full animate-fadeInUp">
                <EntityCard
                  id={proj.id}
                  density="comfortable"
                  title={proj.name}
                  subtitle={proj.code}
                  avatar={<EntityAvatar name={proj.name} size={40} />}
                  statusBadge={<StatusBadge status={getEntityStatus(proj.is_deleted, proj.is_active)} />}
                  onClick={() => navigate(`/pqm/nc-management/${proj.id}`)}
                  metrics={[
                    { label: 'Location', value: proj.location || 'N/A', icon: <MapPin className="h-3.5 w-3.5" /> },
                    { label: 'Capacity', value: proj.capacity || 'N/A', icon: <Zap className="h-3.5 w-3.5" /> }
                  ]}
                  actions={[
                    { label: 'View Project Details', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/pqm/projects/${proj.id}`) },
                    { label: 'Enter Workspace', icon: <ArrowRight className="h-4 w-4" />, onClick: () => navigate(`/pqm/nc-management/${proj.id}`) }
                  ]}
                />
              </div>
            ))}
          </CardGrid>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

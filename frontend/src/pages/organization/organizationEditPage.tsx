import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrganizationForm } from '@/features/organization/components/OrganizationForm';
import { useOrganization } from '@/features/organization/hooks/useOrganizations';
import { Organization } from '@/features/organization/types/organizationTypes';

export const OrganizationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: org, isLoading, error } = useOrganization(id || '');

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex-shrink-0 border-b border-gray-200/60 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-gray-800/60 dark:bg-gray-900/80">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100/80 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm font-medium hidden sm:flex">
            <Link
              to="/platform/organizations"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Organizations
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              to={`/platform/organizations/${id}`}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors truncate max-w-[150px]"
            >
              {org?.name || 'Organization'}
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 dark:text-white">Edit</span>
          </nav>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Edit Organization
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update details for {org?.name || 'this organization'}.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-sm font-medium text-gray-500">Loading organization...</p>
            </div>
          ) : error || !org ? (
             <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 flex flex-col items-center justify-center text-center dark:border-rose-900/30 dark:bg-rose-900/10">
              <AlertCircle className="h-8 w-8 text-rose-500 mb-3" />
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400">Failed to load</h3>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-500">
                The organization could not be found or you don't have permission.
              </p>
              <button 
                onClick={() => navigate('/platform/organizations')}
                className="mt-4 px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-medium shadow-sm hover:bg-rose-50 dark:bg-gray-800 dark:border-rose-900/50 dark:hover:bg-rose-900/20"
              >
                Return to Organizations
              </button>
            </div>
          ) : (
            <OrganizationForm 
              organization={org}
              onSuccess={() => navigate(`/platform/organizations/${id}`)} 
              onCancel={() => navigate(`/platform/organizations/${id}`)} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

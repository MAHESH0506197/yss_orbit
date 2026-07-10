import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrganizationForm } from '@/features/organization/components/OrganizationForm';

export const OrganizationCreatePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex-shrink-0 border-b border-gray-200/60 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-gray-800/60 dark:bg-gray-900/80">
        <div className="flex items-center gap-4">
          <Link
            to="/platform/organizations"
            className="group flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100/80 text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm font-medium hidden sm:flex">
            <Link
              to="/platform/organizations"
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Organizations
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 dark:text-white">New Organization</span>
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
                Create Organization
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Set up a new organization tenant.
              </p>
            </div>
          </div>

          <OrganizationForm 
            onSuccess={() => navigate('/platform/organizations')} 
            onCancel={() => navigate('/platform/organizations')} 
          />
        </div>
      </main>
    </div>
  );
};

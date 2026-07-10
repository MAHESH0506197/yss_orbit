import React, { useMemo } from 'react';
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pqmService } from '../api/pqmService';
import { TabBar } from '@/components/platform/TabBar';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Users,
  Settings,
  FolderGit2,
  ChevronLeft,
  Zap
} from 'lucide-react';
import { EntityAvatar } from '@/components/platform/EntityAvatar';

export const ProjectWorkspaceLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['pqm-projects'],
    queryFn: () => pqmService.listProjects()
  });

  const project = useMemo(() => projectsData?.results?.find((p: any) => p.id === projectId), [projectsData, projectId]);

  if (isLoading) return <PageSkeleton />;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FolderGit2 className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Workspace Not Found</h2>
        <p className="text-gray-500 max-w-md">The project workspace you are looking for does not exist or you don't have access.</p>
        <button onClick={() => navigate('/pqm/nc-management')} className="mt-4 text-violet-600 hover:underline">
          Return to NC Management
        </button>
      </div>
    );
  }

  // Determine active tab based on current path
  const currentPath = location.pathname;
  const basePath = `/pqm/nc-management/${projectId}`;
  let activeTab = 'dashboard';
  
  if (currentPath.startsWith(`${basePath}/nc`)) activeTab = 'ncs';
  else if (currentPath.startsWith(`${basePath}/docs`)) activeTab = 'docs';
  else if (currentPath.startsWith(`${basePath}/team`)) activeTab = 'team';
  else if (currentPath.startsWith(`${basePath}/config`)) activeTab = 'settings';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ncs', label: 'NCs', icon: ShieldAlert },
    { id: 'team', label: 'Project Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    switch(tabId) {
      case 'dashboard': navigate(`/pqm/nc-management/${projectId}`); break;
      case 'ncs': navigate(`/pqm/nc-management/${projectId}/nc`); break;
      case 'team': navigate(`/pqm/nc-management/${projectId}/team`); break; // Placeholder
      case 'settings': navigate(`/pqm/nc-management/${projectId}/config`); break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/50">
      {/* Workspace Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pqm/nc-management')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to NC Management"
              >
                <ChevronLeft size={20} />
              </button>
              <EntityAvatar name={project.name} size={48} />
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                  {project.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md">
                    {project.code}
                  </span>
                  {project.capacity && (
                    <>
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        {project.capacity}
                      </span>
                      <span className="text-sm text-gray-300 dark:text-gray-700">•</span>
                    </>
                  )}
                  <span className="text-sm font-medium text-gray-500">Quality Workspace</span>
                </div>
              </div>
            </div>
          </div>
          
          <TabBar
            tabs={tabs as any}
            activeTab={activeTab as any}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

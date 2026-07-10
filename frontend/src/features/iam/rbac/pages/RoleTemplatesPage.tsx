import React, { useMemo, useState } from 'react';
import { 
  Plus, ChevronRight, Edit2, Trash2, Key, ArrowLeft, 
  Search, Shield, Layers, Users, Clock, Database, Wallet, Info, RotateCcw, Power, PowerOff, MoreHorizontal, X, Archive
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { RoleTemplate, RbacModule, RbacSubModule, StatusFilter, SearchScope } from '../types/roleTypes';
import { 
  useRoleTemplates, useDeleteRoleTemplate, useRestoreRoleTemplate, useToggleRoleTemplateActive, useHardDeleteRoleTemplate,
  useModules, useSubModules, useCreateModule, useUpdateModule, useArchiveModule, useRestoreModule, useHardDeleteModule,
  useCreateSubModule, useUpdateSubModule, useArchiveSubModule, useRestoreSubModule, useHardDeleteSubModule
} from '../hooks/useRoles';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { EntityCard } from '@/components/platform/EntityCard';
import { EmptyState } from '@/components/data_display/EmptyState';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { RoleTemplateForm } from '../components/RoleTemplateForm';
import { RoleTemplatePermissionsMatrix } from '../components/RoleTemplatePermissionsMatrix';
import { RoleTemplateViewPane } from '../components/RoleTemplateViewPane';
import { HardDeleteConfirmDialog } from '../components/HardDeleteConfirmDialog';

export function RoleTemplatesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  // QUALITY-04 fix: pass statusFilter to the hook so switching active/inactive refetches.
  const { data: allTemplates, isLoading, isFetching } = useRoleTemplates(undefined, statusFilter);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('role_templates', 'grid');
  const deleteMutation = useDeleteRoleTemplate();
  const restoreMutation = useRestoreRoleTemplate();
  const hardDeleteMutation = useHardDeleteRoleTemplate();
  const toggleMutation = useToggleRoleTemplateActive();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
  
  const mainModule = searchParams.get('mainModule');
  const subModule = searchParams.get('subModule');
  
  const setSubModule = (code: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subModule', code);
    setSearchParams(newParams);
  };

  const [searchInput, setSearchInput] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('roles');
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<RoleTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [managingPermissionsFor, setManagingPermissionsFor] = useState<RoleTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<RoleTemplate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [templateToHardDelete, setTemplateToHardDelete] = useState<RoleTemplate | null>(null);
  const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{
    title: string;
    description: string;
    type: 'module' | 'submodule';
    status: string;
    subModulesCount?: number;
    templatesCount?: number;
  } | null>(null);

  const [editFormData, setEditFormData] = useState({ id: '', code: '', title: '', description: '', type: 'module' as 'module' | 'submodule', parentModule: '', is_active: true });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<{id: string, code: string, type: 'module' | 'submodule'} | null>(null);
  const [confirmModuleOpen, setConfirmModuleOpen] = useState(false);
  const [moduleToHardDelete, setModuleToHardDelete] = useState<{id: string, code: string, type: 'module' | 'submodule'} | null>(null);
  const [hardDeleteModuleConfirmOpen, setHardDeleteModuleConfirmOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch modules with inactive + deleted included for admin management view.
  const { data: dbModules } = useModules(true, true);
  // Fetch sub-modules with inactive + deleted for admin management view.
  const { data: dbSubModules } = useSubModules(undefined, true, true);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const archiveModule = useArchiveModule();
  const restoreModule = useRestoreModule();
  const createSubModule = useCreateSubModule();
  const updateSubModule = useUpdateSubModule();
  const archiveSubModule = useArchiveSubModule();
  const restoreSubModule = useRestoreSubModule();
  const hardDeleteModuleMutation = useHardDeleteModule();
  const hardDeleteSubModuleMutation = useHardDeleteSubModule();

  React.useEffect(() => {
    setSelectedIds([]);
  }, [mainModule, subModule]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.length > 0 && selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const handleBulkArchive = async () => {
    if (!selectedIds.length) return;
    try {
      if (!mainModule && !subModule) {
        await Promise.allSettled(selectedIds.map(id => archiveModule.mutateAsync(id)));
        toast.success(`${selectedIds.length} modules archived.`);
      } else if (mainModule && !subModule) {
        await Promise.allSettled(selectedIds.map(id => archiveSubModule.mutateAsync(id)));
        toast.success(`${selectedIds.length} sub-modules archived.`);
      } else if (subModule) {
        await Promise.allSettled(selectedIds.map(id => deleteMutation.mutateAsync(id)));
        toast.success(`${selectedIds.length} role templates archived.`);
      }
      setSelectedIds([]);
    } catch (e) {
      toast.error('Failed to perform bulk archive operation');
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedIds.length) return;
    try {
      if (!mainModule && !subModule) {
        await Promise.allSettled(selectedIds.map(id => restoreModule.mutateAsync(id)));
        toast.success(`${selectedIds.length} modules restored.`);
      } else if (mainModule && !subModule) {
        await Promise.allSettled(selectedIds.map(id => restoreSubModule.mutateAsync(id)));
        toast.success(`${selectedIds.length} sub-modules restored.`);
      } else if (subModule) {
        await Promise.allSettled(selectedIds.map(id => restoreMutation.mutateAsync(id)));
        toast.success(`${selectedIds.length} role templates restored.`);
      }
      setSelectedIds([]);
    } catch (e) {
      toast.error('Failed to perform bulk restore operation');
    }
  };

  const activeModules = useMemo(() => {
    const merged: Record<string, any> = {};
    if (!dbModules) return merged;

    dbModules.forEach((mod: any) => {
      merged[mod.code] = {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        is_active: mod.is_active,
        is_deleted: mod.is_deleted,
        icon: Shield, // Fallback icon
        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400',
        color: 'from-indigo-500 to-indigo-600',
        subModules: []
      };
    });

    if (dbSubModules) {
      dbSubModules.forEach((sub: any) => {
        if (merged[sub.parent_module_code]) {
          merged[sub.parent_module_code].subModules.push(sub.code);
        }
      });
    }

    return merged;
  }, [dbModules, dbSubModules]);

  const activeSubModulesList = useMemo(() => {
    if (!dbSubModules) return [];
    if (mainModule) {
      return dbSubModules.filter((sub: any) => sub.parent_module_code === mainModule).map((s: any) => s.code);
    }
    return dbSubModules.map((s: any) => s.code);
  }, [mainModule, dbSubModules]);

  // Apply Status Filter to ALL templates first
  const statusFilteredTemplates = useMemo(() => {
    if (!allTemplates) return [];
    if (statusFilter === 'active') {
      return allTemplates.filter((t: any) => !t.is_deleted && t.is_active !== false);
    } else if (statusFilter === 'inactive') {
      return allTemplates.filter((t: any) => !t.is_deleted && t.is_active === false);
    } else if (statusFilter === 'archived') {
      return allTemplates.filter((t: any) => t.is_deleted);
    }
    return allTemplates; // 'all'
  }, [allTemplates, statusFilter]);

  const getMainModuleForSubModule = (subModuleCode: string) => {
    if (!dbSubModules) return 'other';
    const sub = dbSubModules.find((s: any) => s.code === subModuleCode);
    return sub ? sub.parent_module_code : 'other';
  };

  // Group 1: By Main Module
  const mainModuleGroups = useMemo(() => {
    if (!statusFilteredTemplates) return {};
    const groups: Record<string, any[]> = {};
    statusFilteredTemplates.forEach((t: any) => {
      const code = t.module_code || 'other';
      const main = getMainModuleForSubModule(code);
      if (!groups[main]) groups[main] = [];
      groups[main].push(t);
    });
    return groups;
  }, [statusFilteredTemplates, dbSubModules]);

  // Group 2: By Sub Module (filtered by selected Main Module)
  const subModuleGroups = useMemo(() => {
    if (!statusFilteredTemplates || !mainModule) return {};
    const groups: Record<string, any[]> = {};
    statusFilteredTemplates.forEach((t: any) => {
      const code = t.module_code || 'other';
      const main = getMainModuleForSubModule(code);
      if (main === mainModule) {
        if (!groups[code]) groups[code] = [];
        groups[code].push(t);
      }
    });
    return groups;
  }, [statusFilteredTemplates, mainModule, dbSubModules]);

  // Final Filter: For the Data Table
  const filteredTemplates = useMemo(() => {
    let list = statusFilteredTemplates;
    
    if (subModule) {
      list = list.filter((t: any) => (t.module_code || 'other') === subModule);
    }
    
    if (searchInput && searchScope === 'roles') {
      const q = searchInput.toLowerCase();
      list = list.filter((t: any) => 
        (t.name && t.name.toLowerCase().includes(q)) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    } else if (!subModule) {
      return [];
    }
    
    return list;
  }, [statusFilteredTemplates, subModule, searchInput, searchScope]);

  const handleMainModuleClick = (mainCode: string) => {
    setSearchParams({ mainModule: mainCode });
    setSearchInput('');
  };

  const handleSubModuleClick = (subCode: string) => {
    if (mainModule) {
      setSearchParams({ mainModule, subModule: subCode });
      setSearchInput('');
    }
  };

  const handleBackClick = () => {
    if (viewingTemplate) {
      setViewingTemplate(null);
    } else if (managingPermissionsFor) {
      setManagingPermissionsFor(null);
    } else if (isAddingTemplate || editingTemplate) {
      setIsAddingTemplate(false);
      setEditingTemplate(null);
    } else if (subModule) {
      // Go back to Main Module level
      setSearchParams(mainModule ? { mainModule } : {});
      setSearchInput('');
      setSearchScope('submodules');
    } else if (mainModule) {
      // Go back to root level
      setSearchParams({});
      setSearchInput('');
      setSearchScope('domains');
    } else {
      navigate('/platform/roles');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    setTemplateToDelete(template);
    setConfirmOpen(true);
  };

  const handleHardDeleteTemplateClick = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    setTemplateToHardDelete(template);
    setHardDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id, {
        onSuccess: () => {
          toast.success('Role template deleted');
          setConfirmOpen(false);
          setTemplateToDelete(null);
        }
      });
    }
  };

  const handleConfirmHardDelete = async () => {
    if (templateToHardDelete) {
      try {
        await hardDeleteMutation.mutateAsync(templateToHardDelete.id);
      } catch (err) {
        // toast is handled in the hook
      } finally {
        setHardDeleteConfirmOpen(false);
        setTemplateToHardDelete(null);
      }
    }
  };

  const handleEditModuleClick = (e: React.MouseEvent, code: string, currentTitle: string, currentDescription: string, type: 'module' | 'submodule') => {
    e.stopPropagation();
    let id = '';
    let parentModule = '';
    let is_active = true;
    if (type === 'module') {
      id = activeModules[code]?.id || '';
      is_active = activeModules[code]?.is_active ?? true;
    } else {
      const sub = dbSubModules?.find((s: any) => s.code === code);
      id = sub?.id || '';
      parentModule = sub?.parent_module_code || mainModule || '';
      is_active = sub?.is_active ?? true;
    }
    
    setEditFormData({ id, code, title: currentTitle, description: currentDescription, type, parentModule, is_active });
    setEditModalOpen(true);
  };

  const handleCreateModuleClick = (type: 'module' | 'submodule') => {
    setEditFormData({ 
      id: '',
      code: '', 
      title: '', 
      description: '', 
      type, 
      parentModule: mainModule || Object.keys(activeModules)[0] || '',
      is_active: true
    });
    setEditModalOpen(true);
  };

  const handleSaveEditModule = () => {
    const isNew = !editFormData.id;
    const finalCode = editFormData.code || editFormData.title.replace(/\s+/g, '').toLowerCase() || `custom_${Date.now()}`;

    if (editFormData.type === 'module') {
      if (isNew) {
        createModule.mutate({ code: finalCode, title: editFormData.title, description: editFormData.description, is_active: editFormData.is_active });
      } else {
        updateModule.mutate({ id: editFormData.id, payload: { title: editFormData.title, description: editFormData.description, is_active: editFormData.is_active } });
      }
    } else {
      if (isNew) {
        // Need parent module id
        const parentId = activeModules[editFormData.parentModule]?.id;
        if (!parentId) {
          toast.error("Parent module not found");
          return;
        }
        createSubModule.mutate({ code: finalCode, parent_module_id: parentId, title: editFormData.title, description: editFormData.description, is_active: editFormData.is_active });
      } else {
        updateSubModule.mutate({ id: editFormData.id, payload: { title: editFormData.title, description: editFormData.description, is_active: editFormData.is_active } });
      }
    }
    
    setEditModalOpen(false);
  };

  const handleArchiveModuleClick = (e: React.MouseEvent, code: string, type: 'module' | 'submodule') => {
    e.stopPropagation();
    let id = '';
    if (type === 'module') id = activeModules[code]?.id || '';
    else id = dbSubModules?.find((s: any) => s.code === code)?.id || '';

    if (!id) return;
    setModuleToDelete({ id, code, type });
    setConfirmModuleOpen(true);
  };

  const handleHardDeleteModuleClick = (e: React.MouseEvent, code: string, type: 'module' | 'submodule') => {
    e.stopPropagation();
    let id = '';
    if (type === 'module') id = activeModules[code]?.id || '';
    else id = dbSubModules?.find((s: any) => s.code === code)?.id || '';

    if (!id) return;
    setModuleToHardDelete({ id, code, type });
    setHardDeleteModuleConfirmOpen(true);
  };

  const handleConfirmArchiveModule = () => {
    if (moduleToDelete) {
      if (moduleToDelete.type === 'module') {
        archiveModule.mutate(moduleToDelete.id);
      } else {
        archiveSubModule.mutate(moduleToDelete.id);
      }
      setConfirmModuleOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleConfirmHardDeleteModule = async () => {
    if (moduleToHardDelete) {
      try {
        if (moduleToHardDelete.type === 'module') {
          await hardDeleteModuleMutation.mutateAsync(moduleToHardDelete.id);
        } else {
          await hardDeleteSubModuleMutation.mutateAsync(moduleToHardDelete.id);
        }
      } catch (err) {
        // toast is handled in the hook
      } finally {
        setHardDeleteModuleConfirmOpen(false);
        setModuleToHardDelete(null);
      }
    }
  };

  const handleRestoreModuleClick = (e: React.MouseEvent, code: string, type: 'module' | 'submodule') => {
    e.stopPropagation();
    let id = '';
    if (type === 'module') id = activeModules[code]?.id || '';
    else id = dbSubModules?.find((s: any) => s.code === code)?.id || '';

    if (!id) return;
    if (type === 'module') {
      restoreModule.mutate(id);
    } else {
      restoreSubModule.mutate(id);
    }
  };

  const handleRestoreClick = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    restoreMutation.mutate(template.id);
  };

  const handleInfoClick = (e: React.MouseEvent, info: any) => {
    e.stopPropagation();
    setSelectedInfo(info);
    setInfoModalOpen(true);
  };

  // Only build breadcrumb items if we are deeper than the main page
  const breadcrumbItems = [];
  if (mainModule || isAddingTemplate || editingTemplate || managingPermissionsFor) {
    breadcrumbItems.push({ 
      label: 'All Modules', 
      onClick: () => { setSearchParams({}); setIsAddingTemplate(false); setEditingTemplate(null); setManagingPermissionsFor(null); } 
    });
    
    if (mainModule) {
      // QUALITY-11 fix: show human-readable module title in breadcrumb, not raw code.
      const mainMod = dbModules?.find((m: RbacModule) => m.code === mainModule);
      breadcrumbItems.push({
        label: mainMod?.title ?? mainModule,
        onClick: () => { setSearchParams({ mainModule }); setIsAddingTemplate(false); setEditingTemplate(null); setManagingPermissionsFor(null); },
        active: !subModule && !isAddingTemplate && !editingTemplate && !managingPermissionsFor
      });
    }

    if (subModule) {
      // Show sub-module title in breadcrumb instead of raw code.
      const subMod = dbSubModules?.find((s: RbacSubModule) => s.code === subModule);
      breadcrumbItems.push({
        label: subMod?.title ?? (subModule.charAt(0).toUpperCase() + subModule.slice(1)),
        onClick: () => { setSearchParams({ mainModule: mainModule || '', subModule }); setIsAddingTemplate(false); setEditingTemplate(null); setManagingPermissionsFor(null); },
        active: !isAddingTemplate && !editingTemplate && !managingPermissionsFor
      });
    }
    
    if (managingPermissionsFor) {
      breadcrumbItems.push({ label: 'Manage Permissions', active: true, onClick: () => {} });
    } else if (isAddingTemplate) {
      breadcrumbItems.push({ label: 'New Role Template', active: true, onClick: () => {} });
    } else if (editingTemplate) {
      breadcrumbItems.push({ label: 'Edit Role Template', active: true, onClick: () => {} });
    }
  }

  const visibleMainModules = useMemo(() => {
    return Object.entries(activeModules).filter(([mainCode, config]) => {
      const isActive = config.is_active;
      const isDeleted = config.is_deleted;
      if (statusFilter === 'active' && (!isActive || isDeleted)) return false;
      if (statusFilter === 'inactive' && (isActive || isDeleted)) return false;
      if (statusFilter === 'archived' && !isDeleted) return false;

      if (!searchInput || searchScope !== 'domains') return true;
      const q = searchInput.toLowerCase();
      const title = config.title;
      const desc = config.description;
      return (title && title.toLowerCase().includes(q)) || 
             (desc && desc.toLowerCase().includes(q));
    });
  }, [activeModules, statusFilter, searchInput, searchScope]);

  const visibleSubModules = useMemo(() => {
    return activeSubModulesList.filter((subCode: string) => {
      const dbSub = dbSubModules?.find((s: any) => s.code === subCode);
      const isActive = dbSub ? dbSub.is_active : true;
      const isDeleted = dbSub ? dbSub.is_deleted : false;
      
      if (statusFilter === 'active' && (!isActive || isDeleted)) return false;
      if (statusFilter === 'inactive' && (isActive || isDeleted)) return false;
      if (statusFilter === 'archived' && !isDeleted) return false;

      if (!searchInput || searchScope !== 'submodules') return true;
      const q = searchInput.toLowerCase();
      const title = dbSub?.title || subCode;
      const desc = dbSub?.description || '';
      return (title && title.toLowerCase().includes(q)) || 
             (desc && desc.toLowerCase().includes(q));
    });
  }, [activeSubModulesList, dbSubModules, statusFilter, searchInput, searchScope]);

  const visibleTemplates = useMemo(() => {
    return statusFilteredTemplates.filter((template: any) => {
      if (subModule && template.module_code !== subModule) return false;
      
      if (!searchInput || searchScope !== 'roles') return true;
      const q = searchInput.toLowerCase();
      return (template.name && template.name.toLowerCase().includes(q)) || 
             (template.description && template.description.toLowerCase().includes(q));
    });
  }, [statusFilteredTemplates, subModule, searchInput, searchScope]);

  const hasArchivedSelected = useMemo(() => {
    if (selectedIds.length === 0) return false;
    return selectedIds.some(id => {
      if (!mainModule) {
        return Object.values(activeModules).find(m => m.id === id)?.is_deleted;
      } else if (!subModule) {
        return dbSubModules?.find((s: any) => s.id === id)?.is_deleted;
      } else {
        return allTemplates?.find((t: any) => t.id === id)?.is_deleted;
      }
    });
  }, [selectedIds, mainModule, subModule, activeModules, dbSubModules, allTemplates]);

  const hasActiveSelected = useMemo(() => {
    if (selectedIds.length === 0) return false;
    return selectedIds.some(id => {
      if (!mainModule) {
        const mod = Object.values(activeModules).find(m => m.id === id);
        return mod && !mod.is_deleted;
      } else if (!subModule) {
        const sub = dbSubModules?.find((s: any) => s.id === id);
        return sub && !sub.is_deleted;
      } else {
        const t = allTemplates?.find((t: any) => t.id === id);
        return t && !t.is_deleted;
      }
    });
  }, [selectedIds, mainModule, subModule, activeModules, dbSubModules, allTemplates]);

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <RefetchBar visible={isFetching} />
      <PageHeader 
        icon={Shield}
        iconGradient="from-indigo-500 via-violet-500 to-purple-600"
        title="Role & Permission Templates"
        subtitle="Centrally define standard Role identities and configure their Permissions matrices. These global blueprints are automatically cloned into Business Units."
        countBadge={allTemplates?.length}
        countBadgeLabel={`${allTemplates?.length ?? 0} total templates`}
        breadcrumbs={breadcrumbItems}
        actions={
          !(isAddingTemplate || editingTemplate || managingPermissionsFor) && (
            <button
              onClick={() => {
                if (!mainModule) handleCreateModuleClick('module');
                else if (!subModule) handleCreateModuleClick('submodule');
                else setIsAddingTemplate(true);
              }}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-950 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
              {!mainModule ? 'New Module' : !subModule ? 'New Sub-Module' : 'New Role Template'}
            </button>
          )
        }
      />

      {/* Main Content Area */}
      <div className="mt-8">
        {isAddingTemplate || editingTemplate ? (
          <div className="mt-8">
            <RoleTemplateForm
              template={editingTemplate}
              defaultModuleCode={subModule || mainModule || undefined}
              onCancel={() => {
                setIsAddingTemplate(false);
                setEditingTemplate(null);
              }}
            />
          </div>
        ) : managingPermissionsFor ? (
          <div className="mt-8">
            <RoleTemplatePermissionsMatrix
              template={managingPermissionsFor}
              onBack={() => setManagingPermissionsFor(null)}
            />
          </div>
        ) : viewingTemplate ? (
          <div className="mt-8">
            <RoleTemplateViewPane
              template={viewingTemplate}
              onCancel={() => setViewingTemplate(null)}
            />
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm mb-6">
              {/* Toolbar */}
              <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
                
                {selectedIds.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-indigo-50/95 dark:bg-indigo-900/95 backdrop-blur-sm z-30 flex items-center justify-between px-5 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedIds([])}
                        className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 transition-colors"
                        aria-label="Clear selection"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                        {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActiveSelected && (
                        <button
                          onClick={handleBulkArchive}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                      {hasArchivedSelected && (
                        <button
                          onClick={handleBulkRestore}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Search */}
                <div className="flex items-center gap-2 w-full xl:max-w-md flex-1">
                  <select
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value as any)}
                    aria-label="Search Scope"
                    className="h-10 px-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/20 cursor-pointer transition-all"
                  >
                    {!mainModule && <option value="domains">Search Modules</option>}
                    {!subModule && <option value="submodules">Search Sub-Modules</option>}
                    <option value="roles">Search Role Templates</option>
                  </select>
                  
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Type to filter..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-8 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all hover:border-gray-300 dark:hover:border-gray-600"
                    />
                    {searchInput && (
                      <button
                        onClick={() => setSearchInput('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filters & View Toggle */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <div className="hidden sm:inline-flex items-center gap-1 bg-gray-50/80 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-100 dark:border-gray-700/50" role="tablist">
                    {(['all', 'active', 'inactive', 'archived'] as const).map((filter) => {
                      const isSelected = statusFilter === filter;
                      return (
                        <button
                          key={filter}
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setStatusFilter(filter)}
                          className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all duration-200 ${
                            isSelected
                              ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <span className="relative z-10">{filter}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <ViewModeToggle 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    density={density} 
                    setDensity={setDensity} 
                  />
                </div>
              </div>
            </div>

          {(!mainModule && (!searchInput || searchScope === 'domains')) ? (
            // LEVEL 1: Main Modules Grid
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Modules</h2>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {Object.keys(activeModules).length} Modules containing {allTemplates?.length || 0} Role Templates
                </span>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                      <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(activeModules)
                    .filter(([mainCode, config]) => {
                      const isActive = config.is_active;
                      const isDeleted = config.is_deleted;
                      if (statusFilter === 'active' && (!isActive || isDeleted)) return false;
                      if (statusFilter === 'inactive' && (isActive || isDeleted)) return false;
                      if (statusFilter === 'archived' && !isDeleted) return false;

                      if (!searchInput || searchScope !== 'domains') return true;
                      const q = searchInput.toLowerCase();
                      const title = config.title;
                      const desc = config.description;
                      return (mainCode && mainCode.toLowerCase().includes(q)) || 
                             (title && title.toLowerCase().includes(q)) || 
                             (desc && desc.toLowerCase().includes(q));
                    })
                    .map(([mainCode, config]) => {
                    const templates = mainModuleGroups[mainCode] || [];
                    const Icon = config.icon || Shield;
                    const title = config.title;
                    const desc = config.description;
                    
                    const activeSubModulesCount = new Set(templates.map((t: any) => t.module_code || 'other')).size;
                    const totalSubModules = config.subModules.length;
                    
                    return (
                      <div 
                        key={mainCode} 
                        onClick={() => handleMainModuleClick(mainCode)}
                        className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 flex flex-col h-full"
                      >
                        <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${config.color} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                        
                        <div className="flex items-start justify-between mb-5 relative z-10">
                          <div className={`p-3.5 rounded-xl ${config.bg} ${config.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => handleInfoClick(e, {
                                title: title,
                                description: desc,
                                type: 'module',
                                status: config.is_active ? 'Active' : 'Inactive',
                                subModulesCount: config.subModules.length,
                                templatesCount: templates.length
                              })}
                              className="p-1.5 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors focus:outline-none"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:hover:bg-gray-800 dark:hover:text-white"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                                <div className="px-2 py-1.5 mb-1">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{mainCode} Module</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">System module configuration</p>
                                </div>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                
                                <DropdownMenuItem onClick={() => handleMainModuleClick(mainCode)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                  <Layers className="h-4 w-4 text-gray-400" />
                                  View Sub-Modules
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={(e) => handleInfoClick(e, {
                                  title: title,
                                  description: desc,
                                  type: 'module',
                                  status: config.is_active ? 'Active' : 'Inactive',
                                  subModulesCount: config.subModules.length,
                                  templatesCount: templates.length
                                })} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                  <Info className="h-4 w-4 text-gray-400" />
                                  Module Details
                                </DropdownMenuItem>
                        
                                <DropdownMenuItem onClick={(e) => handleEditModuleClick(e, mainCode, title, desc, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                  <Edit2 className="h-4 w-4 text-gray-400" />
                                  Edit Module
                                </DropdownMenuItem>
                                
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                
                                {!config.is_deleted ? (
                                  <DropdownMenuItem onClick={(e) => handleArchiveModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                    <Archive className="h-4 w-4" />
                                    Archive Module
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={(e) => handleRestoreModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors">
                                    <RotateCcw className="h-4 w-4" />
                                    Restore Module
                                  </DropdownMenuItem>
                                )}

                                {isSuperAdmin && (
                                  <>
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                    <DropdownMenuItem onClick={(e) => handleHardDeleteModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                      <Trash2 className="h-4 w-4" />
                                      Permanent Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="relative z-10 flex-1 flex flex-col">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{desc}</p>
                          
                          <div className="mt-auto flex items-center gap-2 pt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {totalSubModules} {totalSubModules === 1 ? 'Sub-Module' : 'Sub-Modules'}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:bg-indigo-400">
                              {templates.length} {templates.length === 1 ? 'Role Template' : 'Role Templates'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm text-left relative">
                    <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                      <tr className="divide-x divide-dashed divide-white/20">
                        <th className="w-12 px-4 py-3.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length > 0 && selectedIds.length === visibleMainModules.length}
                            onChange={() => toggleSelectAll(visibleMainModules.map(([_, c]) => c.id))}
                            className="rounded border-white/30 bg-white/10 text-violet-500 focus:ring-white/20 cursor-pointer" 
                          />
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Module</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Sub-Modules</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Role Templates</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                        {visibleMainModules.map(([mainCode, config]) => {
                            const templates = mainModuleGroups[mainCode] || [];
                            const Icon = config.icon || Shield;
                            const totalSubModules = config.subModules.length;
                            const title = config.title;
                            const desc = config.description;

                            return (
                              <tr 
                                key={mainCode} 
                                onClick={() => handleMainModuleClick(mainCode)}
                                className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900 transition-colors group cursor-pointer divide-x divide-dashed divide-gray-200 dark:divide-gray-800"
                              >
                                <td className="w-12 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedIds.includes(config.id)}
                                    onChange={() => toggleSelect(config.id)}
                                    className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 dark:bg-gray-800 cursor-pointer" 
                                  />
                                </td>
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${config.bg} ${config.text} border border-gray-100 dark:border-gray-700`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {title}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md truncate mt-0.5">
                                        {desc}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3.5">
                                  {config.is_deleted ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Archived
                                    </span>
                                  ) : config.is_active ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                    {totalSubModules} {totalSubModules === 1 ? 'Sub-Module' : 'Sub-Modules'}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                    {templates.length} {templates.length === 1 ? 'Template' : 'Templates'}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          aria-label={`Actions for ${mainCode}`}
                                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                                        <div className="px-2 py-1.5 mb-1">
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{mainCode} Module</p>
                                          <p className="text-[10px] text-gray-500 dark:text-gray-400">System module configuration</p>
                                        </div>
                                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                        
                                        <DropdownMenuItem onClick={() => handleMainModuleClick(mainCode)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                          <Layers className="h-4 w-4 text-gray-400" />
                                          View Sub-Modules
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem onClick={() => handleInfoClick({stopPropagation: () => {}} as any, {
                                          title: title,
                                          description: desc,
                                          type: 'module',
                                          status: config.is_active ? 'Active' : 'Inactive',
                                          subModulesCount: config.subModules.length,
                                          templatesCount: templates.length
                                        })} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                          <Info className="h-4 w-4 text-gray-400" />
                                          Module Details
                                        </DropdownMenuItem>
                                
                                        <DropdownMenuItem onClick={(e) => handleEditModuleClick(e, mainCode, title, desc, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                          <Edit2 className="h-4 w-4 text-gray-400" />
                                          Edit Module
                                        </DropdownMenuItem>
                                        
                                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                        
                                        {!config.is_deleted ? (
                                          <DropdownMenuItem onClick={(e) => handleArchiveModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                            <Archive className="h-4 w-4" />
                                            Archive Module
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem onClick={(e) => handleRestoreModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors">
                                            <RotateCcw className="h-4 w-4" />
                                            Restore Module
                                          </DropdownMenuItem>
                                        )}

                                        {isSuperAdmin && (
                                          <>
                                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                            <DropdownMenuItem onClick={(e) => handleHardDeleteModuleClick(e, mainCode, 'module')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                              <Trash2 className="h-4 w-4" />
                                              Permanent Delete
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (!subModule && (!searchInput || searchScope === 'submodules')) ? (
            // LEVEL 2: Sub Modules Grid
            <div className="mt-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{mainModule ? activeModules[mainModule as keyof typeof activeModules]?.title : 'All'} Sub-Modules</h2>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {mainModule ? activeModules[mainModule as keyof typeof activeModules]?.subModules.length || 0 : activeSubModulesList.length} Sub-Modules
                </span>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeSubModulesList
                  .filter((subCode: string) => {
                    const dbSub = dbSubModules?.find((s: any) => s.code === subCode);
                    const isActive = dbSub ? dbSub.is_active !== false : true;
                    const isDeleted = dbSub ? dbSub.is_deleted : false;
                    if (statusFilter === 'active' && (!isActive || isDeleted)) return false;
                    if (statusFilter === 'inactive' && (isActive || isDeleted)) return false;
                    if (statusFilter === 'archived' && !isDeleted) return false;

                    if (!searchInput || searchScope !== 'submodules') return true;
                    const q = searchInput.toLowerCase();
                    const title = dbSub?.title || subCode;
                    const desc = dbSub?.description || '';
                    return (subCode && subCode.toLowerCase().includes(q)) || 
                           (title && title.toLowerCase().includes(q)) || 
                           (desc && desc.toLowerCase().includes(q));
                  })
                  .map((subCode: string) => {
                    const templates = subModuleGroups[subCode] || [];
                    const dbSub = dbSubModules?.find((s: any) => s.code === subCode);
                    const Icon = Shield;
                    const title = dbSub?.title || subCode;
                    const desc = dbSub?.description || 'Manage permissions and roles for this module area.';
                    const isDeleted = dbSub ? dbSub.is_deleted : false;
                    return (
                      <div 
                        key={subCode} 
                        onClick={() => setSubModule(subCode)}
                        className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 flex flex-col h-full"
                      >
                        <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className={`w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:hover:bg-gray-800 dark:hover:text-white"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                              <div className="px-2 py-1.5 mb-1">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">System sub-module</p>
                              </div>
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                              
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSubModule(subCode); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                <Layers className="h-4 w-4 text-gray-400" />
                                View Role Templates
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleInfoClick(e, {
                                  title: title,
                                  description: desc,
                                  type: 'submodule',
                                  status: dbSub?.is_active !== false ? 'Active' : 'Inactive',
                                  subModulesCount: 0,
                                  templatesCount: templates.length
                                });
                              }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                <Info className="h-4 w-4 text-gray-400" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={(e) => handleEditModuleClick(e, subCode, title, desc, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                <Edit2 className="h-4 w-4 text-gray-400" />
                                Edit Sub-Module
                              </DropdownMenuItem>
                              
                              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                              
                              {!isDeleted ? (
                                <DropdownMenuItem onClick={(e) => handleArchiveModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                  <Archive className="h-4 w-4" />
                                  Archive Sub-Module
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={(e) => handleRestoreModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors">
                                  <RotateCcw className="h-4 w-4" />
                                  Restore Sub-Module
                                </DropdownMenuItem>
                              )}

                              {isSuperAdmin && (
                                <>
                                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                  <DropdownMenuItem onClick={(e) => handleHardDeleteModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                    Permanent Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{desc}</p>
                        
                        <div className="mt-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {templates.length} {templates.length === 1 ? 'Role Template' : 'Role Templates'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm text-left relative">
                    <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                      <tr className="divide-x divide-dashed divide-white/20">
                        <th className="w-12 px-4 py-3.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length > 0 && selectedIds.length === activeSubModulesList.length}
                            onChange={() => {
                                const dbSubs = dbSubModules || [];
                                const ids = activeSubModulesList.map(code => dbSubs.find(s => s.code === code)?.id).filter(Boolean) as string[];
                                toggleSelectAll(ids);
                            }}
                            className="rounded border-white/30 bg-white/10 text-violet-500 focus:ring-white/20 cursor-pointer" 
                          />
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Sub-Module</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Role Templates</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:divide-gray-800">
                        {(() => {
                          const visibleRows = activeSubModulesList.filter((subCode: string) => {
                            const dbSub = dbSubModules?.find((s: any) => s.code === subCode);
                            const isActive = dbSub ? dbSub.is_active !== false : true;
                            const isDeleted = dbSub ? dbSub.is_deleted : false;
                            if (statusFilter === 'active' && (!isActive || isDeleted)) return false;
                            if (statusFilter === 'inactive' && (isActive || isDeleted)) return false;
                            if (statusFilter === 'archived' && !isDeleted) return false;

                            if (!searchInput || searchScope !== 'submodules') return true;
                            const q = searchInput.toLowerCase();
                            const title = dbSub?.title || subCode;
                            const desc = dbSub?.description || '';
                            return (title && title.toLowerCase().includes(q)) || 
                                   (desc && desc.toLowerCase().includes(q));
                          });

                          return visibleRows.length > 0 ? visibleRows.map((subCode: string) => {
                            const templates = subModuleGroups[subCode] || [];
                          const dbSub = dbSubModules?.find((s: any) => s.code === subCode);
                          const Icon = Shield;
                          
                          const title = dbSub?.title || subCode;
                          const desc = dbSub?.description || 'Manage permissions and roles for this module area.';
                          const isActive = dbSub ? dbSub.is_active : true;
                          const isDeleted = dbSub ? dbSub.is_deleted : false;
                          
                          return (
                            <tr 
                              key={subCode} 
                              onClick={() => setSubModule(subCode)}
                              className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900 transition-colors group cursor-pointer divide-x divide-dashed divide-gray-200 dark:divide-gray-800"
                            >
                              <td className="w-12 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={dbSub?.id ? selectedIds.includes(dbSub.id) : false}
                                  onChange={() => dbSub?.id && toggleSelect(dbSub.id)}
                                  className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 dark:bg-gray-800 cursor-pointer" 
                                />
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-gray-700`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {title}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 max-w-md truncate mt-0.5">
                                      {desc}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                {isDeleted ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Archived
                                  </span>
                                ) : isActive ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 w-fit">
                                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {templates.length} Templates
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        aria-label={`Actions for ${subCode}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                                      <div className="px-2 py-1.5 mb-1">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{title}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">System sub-module</p>
                                      </div>
                                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                      
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSubModule(subCode); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                        <Layers className="h-4 w-4 text-gray-400" />
                                        View Role Templates
                                      </DropdownMenuItem>

                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleInfoClick(e, {
                                          title: title,
                                          description: desc,
                                          type: 'submodule',
                                          status: isActive ? 'Active' : 'Inactive',
                                          subModulesCount: 0,
                                          templatesCount: templates.length
                                        });
                                      }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                        <Info className="h-4 w-4 text-gray-400" />
                                        View Details
                                      </DropdownMenuItem>

                                      <DropdownMenuItem onClick={(e) => handleEditModuleClick(e, subCode, title, desc, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                        <Edit2 className="h-4 w-4 text-gray-400" />
                                        Edit Sub-Module
                                      </DropdownMenuItem>
                                      
                                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                      
                                      {!isDeleted ? (
                                        <DropdownMenuItem onClick={(e) => handleArchiveModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                          <Archive className="h-4 w-4" />
                                          Archive Sub-Module
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onClick={(e) => handleRestoreModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors">
                                          <RotateCcw className="h-4 w-4" />
                                          Restore Sub-Module
                                        </DropdownMenuItem>
                                      )}

                                      {isSuperAdmin && (
                                        <>
                                          <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                          <DropdownMenuItem onClick={(e) => handleHardDeleteModuleClick(e, subCode, 'submodule')} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                            Permanent Delete
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400">
                              No sub-modules found for the selected status filter.
                            </td>
                          </tr>
                        );
                        })()}
                      </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // LEVEL 3: Templates Grid
            <div className="mt-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 bg-gray-50/50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-800">
                    <Search className="h-10 w-10 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matching role templates</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
                    Try adjusting your search criteria or create a new role template for this module.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <CardGrid density={density}>
                  {filteredTemplates.map((template: any, i: number) => {
                    const protected_ = template.is_active === true; // Or some logic
                    return (
                      <div
                        key={template.id}
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
                        className="animate-[fadeInUp_0.3s_ease-out_both] flex flex-col h-full"
                      >
                        <EntityCard
                          id={template.id}
                          density={density}
                          title={template.name}
                          description={template.description || 'Standard role baseline definition.'}
                          avatar={
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                              <Shield className="h-5 w-5" />
                            </div>
                          }
                          statusBadge={
                            template.is_deleted ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wide">
                                Archived
                              </span>
                            ) : template.is_active === false ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide">
                                Inactive
                              </span>
                            ) : null
                          }
                          metrics={[
                            { label: 'Permissions', value: template.permissions?.length || 0, icon: <Key className="h-3.5 w-3.5" /> }
                          ]}
                          actions={[
                            template.is_deleted
                              ? undefined
                              : { label: 'Edit Role', icon: <Edit2 className="h-4 w-4" />, onClick: () => setEditingTemplate(template) },
                            template.is_deleted
                              ? undefined
                              : { label: 'Manage Permissions', icon: <Key className="h-4 w-4" />, onClick: () => setManagingPermissionsFor(template) },
                            template.is_deleted
                              ? { label: 'Restore Role', icon: <RotateCcw className="h-4 w-4" />, onClick: (e: any) => handleRestoreClick(e as any, template) }
                              : { label: 'Archive Role', icon: <Archive className="h-4 w-4" />, danger: true, onClick: (e: any) => handleDeleteClick(e as any, template) },
                            template.is_deleted
                              ? undefined
                              : { 
                                  label: template.is_active !== false ? 'Deactivate Role' : 'Activate Role', 
                                  icon: template.is_active !== false ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />, 
                                  onClick: () => toggleMutation.mutate(template.id) 
                                },
                            isSuperAdmin
                              ? { label: 'Permanent Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: (e: any) => handleHardDeleteTemplateClick(e as any, template) }
                              : undefined
                          ].filter(Boolean) as any}
                          onClick={() => setViewingTemplate(template)}
                        />
                      </div>
                    );
                  })}
                </CardGrid>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm text-left relative">
                    <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                      <tr className="divide-x divide-dashed divide-white/20">
                        <th className="w-12 px-4 py-3.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.length > 0 && selectedIds.length === filteredTemplates.length}
                            onChange={() => toggleSelectAll(filteredTemplates.map((t: any) => t.id))}
                            className="rounded border-white/30 bg-white/10 text-violet-500 focus:ring-white/20 cursor-pointer" 
                          />
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Role Name</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">Permissions</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:divide-gray-800">
                      {filteredTemplates.map((template: any, i: number) => (
                        <tr 
                          key={template.id} 
                          onClick={() => setViewingTemplate(template)}
                          className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900 transition-colors group cursor-pointer divide-x divide-dashed divide-gray-200 dark:divide-gray-800"
                        >
                          <td className="w-12 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(template.id)}
                              onChange={() => toggleSelect(template.id)}
                              className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 dark:bg-gray-800 cursor-pointer" 
                            />
                          </td>
                          <td className="px-6 py-3.5">
                            <button
                              type="button"
                              onClick={() => setViewingTemplate(template)}
                              aria-label={`View details for ${template.name}`}
                              className="flex items-center gap-3 group/btn text-left transition-colors w-full"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center flex-shrink-0 border border-indigo-200/50 dark:border-indigo-700/30">
                                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <span className="font-semibold text-gray-900 dark:text-white group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400 transition-colors truncate">
                                  {template.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm truncate mt-0.5">
                                  {template.description || 'Standard role baseline definition.'}
                                </span>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-3.5">
                            {template.is_deleted ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Archived
                              </span>
                            ) : template.is_active === false ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Inactive
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 w-fit">
                              <Key className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {template.permissions?.length || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`Actions for ${template.name}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:opacity-100 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white dark:data-[state=open]:border-gray-700 dark:data-[state=open]:bg-gray-800/50 dark:data-[state=open]:text-white"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 dark:shadow-gray-900/50">
                                  <div className="px-2 py-1.5 mb-1">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{template.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Manage role template</p>
                                  </div>
                                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                  
                                  <DropdownMenuItem onClick={() => setViewingTemplate(template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                      <Info className="h-3 w-3" />
                                    </div>
                                    View Details
                                  </DropdownMenuItem>

                                  {!template.is_deleted && (
                                    <>
                                      <DropdownMenuItem onClick={() => setEditingTemplate(template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                          <Edit2 className="h-3 w-3" />
                                        </div>
                                        Edit Role
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onClick={() => setManagingPermissionsFor(template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                          <Key className="h-3 w-3" />
                                        </div>
                                        Manage Permissions
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {!template.is_deleted && (
                                    <DropdownMenuItem onClick={() => toggleMutation.mutate(template.id)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer transition-colors">
                                      {template.is_active !== false ? <PowerOff className="h-4 w-4 text-amber-500" /> : <Power className="h-4 w-4 text-green-500" />}
                                      {template.is_active !== false ? 'Deactivate Role' : 'Activate Role'}
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                  
                                  {template.is_deleted ? (
                                    <DropdownMenuItem onClick={(e) => handleRestoreClick(e as any, template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors">
                                      <RotateCcw className="h-4 w-4" />
                                      Restore Role
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={(e) => handleDeleteClick(e as any, template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 cursor-pointer transition-colors">
                                      <Archive className="h-4 w-4" />
                                      Archive Role
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {isSuperAdmin && (
                                    <>
                                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                                      <DropdownMenuItem onClick={(e) => handleHardDeleteTemplateClick(e as any, template)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 cursor-pointer transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                        Permanent Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        opts={{
          title: "Archive Role Template",
          message: `Are you sure you want to archive the template "${templateToDelete?.name}"? It will no longer be available for new business units.`,
          confirmLabel: "Archive",
          cancelLabel: "Cancel",
          variant: "danger",
          onConfirm: handleConfirmDelete
        }}
        onClose={() => setConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />

      <HardDeleteConfirmDialog
        isOpen={hardDeleteConfirmOpen}
        onClose={() => {
          setHardDeleteConfirmOpen(false);
          setTemplateToHardDelete(null);
        }}
        onConfirm={handleConfirmHardDelete}
        entityName={templateToHardDelete?.name || ''}
        entityType="Role Template"
        isLoading={hardDeleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={confirmModuleOpen}
        opts={{
          title: `Archive ${moduleToDelete?.type === 'module' ? 'Module' : 'Sub-Module'}`,
          message: `Are you sure you want to archive "${moduleToDelete?.code}"? It will be hidden from the active list.`,
          confirmLabel: "Archive",
          cancelLabel: "Cancel",
          variant: "danger",
          onConfirm: handleConfirmArchiveModule
        }}
        onClose={() => setConfirmModuleOpen(false)}
      />

      <HardDeleteConfirmDialog
        isOpen={hardDeleteModuleConfirmOpen}
        onClose={() => {
          setHardDeleteModuleConfirmOpen(false);
          setModuleToHardDelete(null);
        }}
        onConfirm={handleConfirmHardDeleteModule}
        entityName={moduleToHardDelete?.code || ''}
        entityType={moduleToHardDelete?.type === 'module' ? 'Module' : 'Sub-Module'}
        isLoading={hardDeleteModuleMutation.isPending || hardDeleteSubModuleMutation.isPending}
      />

      {/* Edit Module / Sub-Module Modal */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        title={editFormData.code ? `Edit ${editFormData.type === 'module' ? 'Module' : 'Sub-Module'}` : `Create New ${editFormData.type === 'module' ? 'Module' : 'Sub-Module'}`}
      >
        <div className="mt-4 space-y-4">
          {!editFormData.code && editFormData.type === 'submodule' && !mainModule && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Module
              </label>
              <select
                value={editFormData.parentModule || ''}
                onChange={(e) => setEditFormData({...editFormData, parentModule: e.target.value})}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                {Object.keys(activeModules).map(k => <option key={k} value={k}>{activeModules[k].title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {editFormData.type === 'module' ? 'Module Name' : 'Sub-Module Name'}
            </label>
            <input 
              type="text" 
              value={editFormData.title}
              onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
              placeholder="e.g., Finance Operations"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea 
              value={editFormData.description}
              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              rows={3}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Determine if this module is active and visible</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={editFormData.is_active}
                onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setEditModalOpen(false)}
              className="px-5 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEditModule}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{selectedInfo?.title}</h3>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">System Module Details</p>
            </div>
          </div>
        }
      >
        <div className="mt-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {selectedInfo?.description}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Status</span>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border w-fit ${
                selectedInfo?.status === 'Active' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${selectedInfo?.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {selectedInfo?.status}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Sub-Modules</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedInfo?.subModulesCount || 0}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col col-span-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Role Templates Defined</span>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedInfo?.templatesCount || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setInfoModalOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all active:scale-95"
            >
              Close Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

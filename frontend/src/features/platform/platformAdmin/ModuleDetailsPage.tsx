import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Layers, ArrowLeft, Tag, Key, CheckCircle2, XCircle, Shield, Code, Hash, Activity } from 'lucide-react';
import { useSystemModules } from '@/features/tenancy/modules/api/useModules';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export const ModuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: moduleData, isLoading, error } = useSystemModules();
  const setContext = useWorkspaceStore((state) => state.setContext);

  const module = moduleData?.modules?.find(m => m.id === id);

  useEffect(() => {
    if (module) {
      setContext({ pageTitle: `Module: ${module.name}` });
    }
    return () => setContext({ pageTitle: null });
  }, [module, setContext]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center space-y-4 bg-slate-50 dark:bg-gray-900 rounded-3xl m-6">
        <div className="text-red-500 font-medium">Error loading module or module not found.</div>
        <button
          onClick={() => navigate('/platform/module-registry')}
          className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} /> Back to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-gray-950 pb-24">
      {/* ── Action Bar ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 flex items-center justify-between max-w-[1400px] mx-auto">
        <button
          onClick={() => navigate('/platform/module-registry')}
          className="group flex items-center gap-2 rounded-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-gray-300 shadow-sm hover:shadow transition-all hover:bg-slate-50 dark:hover:bg-gray-800 hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
          Back to Registry
        </button>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* ── Professional Hero Banner ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900 border border-slate-200/60 dark:border-gray-800 shadow-sm flex flex-col">
          
          {/* Subtle top gradient instead of massive dark blue */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
          
          {/* Top Section: Icon, Title, Description */}
          <div className="relative p-8 md:p-10 z-10 flex gap-6 items-center max-w-4xl">
            <div className="shrink-0 h-16 w-16 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Box size={32} strokeWidth={2} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {module.name}
              </h1>
              <p className="text-base text-slate-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
                {module.description || "Core platform module handling essential system capabilities."}
              </p>
            </div>
          </div>

          {/* Bottom Section: Integrated Metrics Bar */}
          <div className="relative z-10 bg-slate-50/80 dark:bg-gray-800/30 border-t border-slate-100 dark:border-gray-800 px-8 md:px-10 py-5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 gap-y-6">
              
              {/* Status */}
              <div className="flex flex-col gap-2 border-l-2 border-slate-200 dark:border-gray-700 pl-4 first:border-0 first:pl-0">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} className="text-slate-400" /> Status
                </span>
                <div className="flex items-center">
                  {module.is_active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                      <CheckCircle2 size={16} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      <XCircle size={16} /> Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2 border-l-2 border-slate-200 dark:border-gray-700 pl-4 lg:pl-6">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag size={12} className="text-purple-500" /> Category
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  {module.category_name || "Platform"}
                </span>
              </div>

              {/* Features Count */}
              <div className="flex flex-col gap-2 border-l-2 border-slate-200 dark:border-gray-700 pl-4 lg:pl-6">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers size={12} className="text-indigo-500" /> Features
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  {module.features?.length || 0} Included
                </span>
              </div>

              {/* Module Code */}
              <div className="flex flex-col gap-2 border-l-2 border-slate-200 dark:border-gray-700 pl-4 lg:pl-6">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Code size={12} className="text-pink-500" /> Module Code
                </span>
                <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all" title={module.code}>
                  {module.code}
                </span>
              </div>

              {/* Module ID */}
              <div className="flex flex-col gap-2 border-l-2 border-slate-200 dark:border-gray-700 pl-4 lg:pl-6">
                <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Hash size={12} className="text-slate-400" /> Module ID
                </span>
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-gray-400 break-all" title={module.id}>
                  {module.id}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ── Single Column Features Layout ──────────────────────────────────────── */}
        <div className="w-full">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200/50 dark:border-gray-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-4 tracking-tight">
                <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <Shield size={28} />
                </div>
                Included Capabilities
              </h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Features</span>
                <span className="inline-flex items-center justify-center bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-black px-5 py-2 rounded-xl shadow-md">
                  {module.features?.length || 0}
                </span>
              </div>
            </div>

            {!module.features || module.features.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/50 dark:bg-gray-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-gray-700">
                <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-gray-700">
                  <Layers size={40} className="text-slate-300 dark:text-gray-600" />
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3">No Features Found</h4>
                <p className="text-base text-slate-500 dark:text-gray-400 max-w-md">This module currently does not expose any specific capabilities to the tenant workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {module.features.map((feature: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="relative group flex flex-col bg-white dark:bg-gray-800 rounded-[2rem] p-8 transition-all duration-500 overflow-hidden cursor-default border border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] hover:-translate-y-1"
                  >
                    {/* Subtle Hover Glow Effect */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="shrink-0 h-14 w-14 rounded-2xl bg-slate-50 dark:bg-gray-900 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors duration-500">
                          <Key size={24} />
                        </div>
                        <h5 className="font-black text-gray-900 dark:text-white text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                          {feature.name}
                        </h5>
                      </div>
                      
                      <p className="text-[15px] text-slate-500 dark:text-gray-400 leading-relaxed font-medium mb-8 flex-1">
                        {feature.description || "No description provided."}
                      </p>

                      <div className="mt-auto border-t border-slate-100 dark:border-gray-700/50 pt-5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Feature Code</span>
                        <div className="inline-flex items-center text-[11px] font-mono font-bold text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 transition-colors">
                          {feature.code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

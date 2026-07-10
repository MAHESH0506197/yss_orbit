import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Calendar, AlertCircle, Save, X, Activity, UserCircle2, CheckCircle2, ChevronDown
} from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { PQMProject } from '../../types';
import { useUsers } from '@/features/iam/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';

interface ProjectFormProps {
  initialData?: Partial<PQMProject>;
  onSubmit: (data: Partial<PQMProject>) => Promise<void>;
  isEditing?: boolean;
}

export function ProjectForm({ initialData, onSubmit, isEditing }: ProjectFormProps) {
  const navigate = useNavigate();
  
  // We'll fetch active users for the dropdowns
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ is_active: true, page_size: 200 });
  const users = useMemo(() => usersData?.results || [], [usersData]);

  const [formData, setFormData] = React.useState<Partial<PQMProject>>({
    name: '',
    code: '',
    description: '',
    location: '',
    project_start_date: '',
    expected_project_end_date: '',
    capacity: '',
    construction_incharge_id: '',
    quality_incharge_id: '',
    project_head_id: '',
    quality_head_id: '',
    is_active: true,
    ...initialData,
  });
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      
      // Convert empty strings to null for UUID and Date fields to satisfy backend
      if (!payload.construction_incharge_id) payload.construction_incharge_id = null;
      if (!payload.quality_incharge_id) payload.quality_incharge_id = null;
      if (!payload.project_head_id) payload.project_head_id = null;
      if (!payload.quality_head_id) payload.quality_head_id = null;
      if (!payload.project_start_date) payload.project_start_date = null;
      if (!payload.expected_project_end_date) payload.expected_project_end_date = null;
      
      await onSubmit(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-8 pb-16">
      
      {/* HEADER ACTIONS ONLY */}
      <div className="flex flex-col sm:flex-row items-end justify-end gap-3 w-full">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="rounded-xl font-bold" disabled={loading}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button type="submit" loading={loading} className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all">
            <Save className="w-4 h-4 mr-2" /> {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - MAIN DETAILS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* GENERAL INFO CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 dark:bg-violet-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 relative z-10">
              <div className="sm:col-span-2">
                <Input
                  label="Project Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Solar Park Phase II"
                  className="bg-gray-50/50 dark:bg-gray-800/50"
                />
              </div>

              <div className="sm:col-span-1">
                <Input
                  label="Project Code"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleChange}
                  placeholder="e.g. PRJ-SP2"
                  className="bg-gray-50/50 dark:bg-gray-800/50 font-mono"
                />
              </div>

              <div className="sm:col-span-1">
                <Input
                  label="Project Capacity"
                  name="capacity"
                  value={formData.capacity || ''}
                  onChange={handleChange}
                  placeholder="e.g. 500 MW"
                  className="bg-gray-50/50 dark:bg-gray-800/50"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  placeholder="e.g. Nevada Desert, USA"
                  className="bg-gray-50/50 dark:bg-gray-800/50"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 sm:text-sm transition-all resize-none"
                  rows={4}
                  placeholder="Brief description of the project scope and objectives..."
                />
              </div>
            </div>
          </div>

          {/* PERSONNEL CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Key Personnel</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 relative z-10">
              
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Project Head</label>
                <div className="relative">
                  <select
                    name="project_head_id"
                    value={formData.project_head_id || ''}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2.5 pr-10 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all font-medium"
                    disabled={isLoadingUsers}
                  >
                    <option value="">Select Project Head...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Quality Head</label>
                <div className="relative">
                  <select
                    name="quality_head_id"
                    value={formData.quality_head_id || ''}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2.5 pr-10 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all font-medium"
                    disabled={isLoadingUsers}
                  >
                    <option value="">Select Quality Head...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Construction Incharge</label>
                <div className="relative">
                  <select
                    name="construction_incharge_id"
                    value={formData.construction_incharge_id || ''}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2.5 pr-10 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all font-medium"
                    disabled={isLoadingUsers}
                  >
                    <option value="">Select Construction Incharge...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Quality Incharge</label>
                <div className="relative">
                  <select
                    name="quality_incharge_id"
                    value={formData.quality_incharge_id || ''}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2.5 pr-10 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all font-medium"
                    disabled={isLoadingUsers}
                  >
                    <option value="">Select Quality Incharge...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - TIMELINE & SETTINGS */}
        <div className="space-y-8">
          
          {/* TIMELINE CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Timeline</h3>
            </div>

            <div className="space-y-5">
              <Input
                label="Project Start Date"
                type="date"
                name="project_start_date"
                value={formData.project_start_date || ''}
                onChange={handleChange}
                className="bg-gray-50/50 dark:bg-gray-800/50"
              />
              <Input
                label="Expected End Date"
                type="date"
                name="expected_project_end_date"
                value={formData.expected_project_end_date || ''}
                onChange={handleChange}
                className="bg-gray-50/50 dark:bg-gray-800/50"
              />
            </div>
          </div>

          {/* STATUS CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Settings</h3>
            
            <button
              type="button"
              onClick={handleToggleActive}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                formData.is_active 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${formData.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {formData.is_active ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${formData.is_active ? 'text-emerald-900 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Active Status
                  </p>
                  <p className={`text-xs mt-0.5 ${formData.is_active ? 'text-emerald-700 dark:text-emerald-500' : 'text-gray-500'}`}>
                    {formData.is_active ? 'Project is operational' : 'Project is inactive'}
                  </p>
                </div>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Check, Loader2, Box } from 'lucide-react';
import { useCreateCatalogModule, useUpdateCatalogModule, useCatalogCategories, useCreateCatalogCategory } from '@/features/tenancy/subscription/hooks/useSubscription';
import toast from 'react-hot-toast';

interface ModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleToEdit?: any | null;
}

export const ModuleFormModal: React.FC<ModuleFormModalProps> = ({ isOpen, onClose, moduleToEdit }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState<{ id?: string, name: string; code: string; description: string; isCodeEditedManually?: boolean }[]>([]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCodeEditedManually, setIsCodeEditedManually] = useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } = useCatalogCategories();
  const { mutate: createModule, isPending: isCreating } = useCreateCatalogModule();
  const { mutate: updateModule, isPending: isUpdating } = useUpdateCatalogModule();
  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCatalogCategory();

  const isPending = isCreating || isUpdating;

  // Initialize form when opened (create or edit)
  useEffect(() => {
    if (isOpen) {
      if (moduleToEdit) {
        setName(moduleToEdit.name || '');
        setCode(moduleToEdit.code || '');
        setCategory(moduleToEdit.category || (categories.length > 0 ? (categories[0] as any)?.value : ''));
        setDescription(moduleToEdit.description || '');
        setReason('');
        setIsActive(moduleToEdit.is_active ?? true);
        setIsCodeEditedManually(true); // Don't auto-generate when editing
        
        if (moduleToEdit.features && Array.isArray(moduleToEdit.features)) {
          setFeatures(moduleToEdit.features.map((f: any) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            description: f.description,
            isCodeEditedManually: true
          })));
        } else {
          setFeatures([]);
        }
      } else {
        // Reset for create
        setName('');
        setCode('');
        setCategory(categories.length > 0 ? (categories[0] as any)?.value : '');
        setDescription('');
        setReason('');
        setIsActive(true);
        setFeatures([]);
        setIsCodeEditedManually(false);
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    }
  }, [isOpen, moduleToEdit, categories]);

  // Set default category when categories load (only if not editing and category is empty)
  useEffect(() => {
    if (categories.length > 0 && !category && !moduleToEdit) {
      setCategory((categories[0] as any)?.value);
    }
  }, [categories, category, moduleToEdit]);

  // Helper to generate acronyms or clean uppercase string
  const generateAcronym = (text: string) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    return text.toUpperCase().replace(/[^A-Z0-9_]/g, '');
  };

  // Auto-generate Module Code from Name if not manually edited (Create mode only)
  useEffect(() => {
    if (!isCodeEditedManually && name && !moduleToEdit) {
      setCode(`MODULE_${generateAcronym(name)}`);
    } else if (!isCodeEditedManually && !name && !moduleToEdit) {
      setCode('');
    }
  }, [name, isCodeEditedManually, moduleToEdit]);

  // Update feature codes if Module Code changes (Create mode only)
  useEffect(() => {
    if (moduleToEdit) return; // Don't dynamically update prefix when editing module code
    setFeatures((prev) =>
      prev.map((f) => {
        if (!f.isCodeEditedManually && f.name) {
          const featureBase = f.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
          const prefix = code ? code.replace(/^MODULE_/, '') + '_' : '';
          return { ...f, code: `${prefix}${featureBase}` };
        }
        return f;
      })
    );
  }, [code, moduleToEdit]);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    setFeatures([...features, { name: '', code: '', description: '', isCodeEditedManually: false }]);
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value } as any;
    
    // If name changes and code hasn't been manually edited, auto-update code
    if (field === 'name' && !newFeatures[index]!.isCodeEditedManually) {
      const featureBase = value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
      const prefix = code ? code.replace(/^MODULE_/, '') + '_' : '';
      newFeatures[index]!.code = `${prefix}${featureBase}`;
    }
    
    // Mark code as manually edited if user types in the code field
    if (field === 'code') {
      newFeatures[index]!.isCodeEditedManually = true;
    }
    
    setFeatures(newFeatures);
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = [...features];
    newFeatures.splice(index, 1);
    setFeatures(newFeatures);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      createCategory(
        { name: newCategoryName.trim() },
        {
          onSuccess: (data: any) => {
            setCategory(data.value);
            setIsAddingCategory(false);
            setNewCategoryName('');
            toast.success('Category created successfully');
          },
          onError: () => {
            toast.error('Failed to create category');
          }
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      code,
      category,
      description,
      is_active: isActive,
      features,
      ...(reason && { reason })
    };

    if (moduleToEdit) {
      updateModule(
        { id: moduleToEdit.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Module updated successfully');
            onClose();
          },
          onError: () => {
            toast.error('Failed to update module');
          }
        }
      );
    } else {
      createModule(
        payload,
        {
          onSuccess: () => {
            toast.success('Module created successfully');
            onClose();
          },
          onError: () => {
            toast.error('Failed to create module');
          }
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header (Premium Gradient) */}
        <div className="relative border-b border-gray-100 dark:border-gray-800 shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-fuchsia-600/10 dark:from-violet-600/20 dark:via-purple-600/10 dark:to-fuchsia-600/20" />
          <div className="relative px-6 py-6 sm:px-8 sm:py-8 flex items-start justify-between">
            <div className="flex gap-5 items-start">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 text-white">
                <Box size={28} />
              </div>
              <div className="space-y-1.5 pt-1">
                <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {moduleToEdit ? 'Edit Module' : 'Create New Module'}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {moduleToEdit ? 'Update module details and manage its features.' : 'Define a new module and its features in the catalog.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-white/80 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-6 overflow-y-auto space-y-8 flex-1">
            
            {/* Module Details Section */}
            <div className="space-y-5">
              <h4 className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
                Module Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module Name <span className="text-rose-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all"
                    placeholder="e.g. Retail Management"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module Code <span className="text-rose-500">*</span></label>
                  <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden shadow-sm transition-all focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
                    <span className="pl-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 font-mono font-bold select-none border-r border-gray-200 dark:border-gray-700 pr-3">
                      MODULE_
                    </span>
                    <input
                      required
                      type="text"
                      className="w-full bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none font-mono"
                      placeholder="RETAIL"
                      value={code.startsWith('MODULE_') ? code.substring(7) : code}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
                        setCode(`MODULE_${val}`);
                        setIsCodeEditedManually(true);
                      }}
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-rose-500">*</span></label>
                    {!isAddingCategory && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center transition-colors"
                      >
                        <Plus size={14} className="mr-1" /> Add New Category
                      </button>
                    )}
                  </div>
                  
                  {isAddingCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all"
                        placeholder="Enter new category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {isCreatingCategory ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isLoadingCategories}
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((c: { value: string; label: string }) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all"
                    placeholder="Short description of the module's purpose..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Change Reason (Audit)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm transition-all"
                    placeholder="e.g. Requested by compliance team"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: Reason for this change (stored in audit log)</p>
                </div>

                {/* Status Toggle */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Active Status</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Determines if this module is available in the catalog.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <h4 className="text-sm font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                  Module Features
                </h4>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={16} /> Add Feature
                </button>
              </div>
              
              {features.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No features added yet. Click "Add Feature" to define capabilities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 group">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Feature Name</label>
                            <input
                              required
                              type="text"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                              placeholder="e.g. Inventory Tracking"
                              value={feature.name}
                              onChange={(e) => handleFeatureChange(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Feature Code</label>
                            <input
                              required
                              type="text"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                              placeholder="CODE"
                              value={feature.code}
                              onChange={(e) => handleFeatureChange(idx, 'code', e.target.value.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''))}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                              placeholder="What does this feature do?"
                              value={feature.description}
                              onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          title="Remove Feature"
                          className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors mt-5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 px-6 py-4 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-70 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {moduleToEdit ? 'Save Changes' : 'Create Module'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

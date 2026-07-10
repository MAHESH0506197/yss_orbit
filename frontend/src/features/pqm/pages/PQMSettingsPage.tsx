import React, { useEffect, useState } from "react";
import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/platform/SectionCard";
import { Settings, Plus, Trash2, Edit2, X, CornerDownRight, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Badge } from "@/components/ui/Badge";
import { PQMDropdownOption } from "../types";

type ConfigTab = "dropdowns" | "contractors";
type DropdownFieldType = "priority" | "severity" | "reference_type" | "area" | "category";

export default function PQMSettingsPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("dropdowns");
  const [activeDropdownTab, setActiveDropdownTab] = useState<DropdownFieldType>("priority");

  const getDropdownTooltip = (tab: DropdownFieldType | string) => {
    switch (tab) {
      case "priority": return "Priority determines how quickly the NC needs to be addressed (SLA).";
      case "severity": return "Severity determines the impact of the non-conformance on the project quality or cost.";
      case "reference_type": return "Categorizes the origin document, drawing, or standard violated.";
      case "area": return "The physical location — where on the site the non-conformance occurred.";
      case "category": return "The discipline or type of work, with sub-categories linked properly.";
      default: return "";
    }
  };
  
  const { contractors, fetchConfig, priorities, severities, referenceTypes, areas, categories, subCategories, fetchDropdownConfig } = usePqmStore();

  useEffect(() => {
    fetchConfig();
    fetchDropdownConfig();
  }, []);


  // ── Contractor management ────────────────────────────────────────────────────
  const [ctForm, setCtForm] = useState({ name: "", contact_person: "", contact_email: "" });
  const [ctSubmitting, setCtSubmitting] = useState(false);
  const [editingCtId, setEditingCtId] = useState<string | null>(null);

  const handleContractorSubmit = async () => {
    if (!ctForm.name.trim()) return;
    setCtSubmitting(true);
    try {
      if (editingCtId) {
        await pqmService.updateContractor(editingCtId, ctForm);
      } else {
        await pqmService.createContractor(ctForm);
      }
      cancelCtEdit();
      await fetchConfig();
    } finally { setCtSubmitting(false); }
  };

  const startCtEdit = (c: any) => {
    setEditingCtId(c.id);
    setCtForm({ name: c.name, contact_person: c.contact_person || "", contact_email: c.contact_email || "" });
  };

  const cancelCtEdit = () => {
    setEditingCtId(null);
    setCtForm({ name: "", contact_person: "", contact_email: "" });
  };

  const deleteContractor = async (id: string) => {
    try {
      await pqmService.deleteContractor(id);
      await fetchConfig();
    } catch (e) {
      console.error("Failed to delete contractor");
    }
  };

  // ── Dropdowns management ────────────────────────────────────────────────────
  const [ddForm, setDdForm] = useState({ name: "", display_order: "0" });
  const [ddSubmitting, setDdSubmitting] = useState(false);
  const [editingDdId, setEditingDdId] = useState<string | null>(null);

  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState<string | null>(null);
  const [subCategoryForm, setSubCategoryForm] = useState({ name: "", display_order: "0" });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getActiveDropdownList = () => {
    switch(activeDropdownTab) {
      case "priority": return priorities;
      case "severity": return severities;
      case "reference_type": return referenceTypes;
      case "area": return areas;
      case "category": return categories;
      default: return [];
    }
  };

  const handleDropdownSubmit = async () => {
    if (!ddForm.name.trim()) return;
    setDdSubmitting(true);
    try {
      if (editingDdId) {
        await pqmService.updateDropdownOption(editingDdId, {
          name: ddForm.name,
          display_order: parseInt(ddForm.display_order) || 0,
        });
      } else {
        await pqmService.createDropdownOption({ 
          name: ddForm.name, 
          field_type: activeDropdownTab.toUpperCase(),
          display_order: parseInt(ddForm.display_order) || 0,
          is_active: true
        });
      }
      cancelDdEdit();
      await fetchDropdownConfig();
    } finally { setDdSubmitting(false); }
  };

  const handleSubCategorySubmit = async (parentId: string) => {
    if (!subCategoryForm.name.trim()) return;
    try {
      await pqmService.createDropdownOption({
        name: subCategoryForm.name,
        field_type: "SUB_CATEGORY",
        display_order: parseInt(subCategoryForm.display_order) || 0,
        system_mapping: parentId,
        is_active: true
      });
      setAddingSubCategoryTo(null);
      setSubCategoryForm({ name: "", display_order: "0" });
      await fetchDropdownConfig();
    } catch(e) {
      console.error("Failed to add sub-category");
    }
  };

  const startDdEdit = (opt: PQMDropdownOption) => {
    setEditingDdId(opt.id);
    setDdForm({ name: opt.name, display_order: String(opt.display_order) });
  };

  const cancelDdEdit = () => {
    setEditingDdId(null);
    setDdForm({ name: "", display_order: "0" });
  };

  // ── Unified Category Creation State ───────────────────────────────────────
  type SubCategoryDraft = { id: string, name: string, display_order: string };
  const [categoryDraft, setCategoryDraft] = useState<{name: string, display_order: string, subCategories: SubCategoryDraft[]}>({
    name: "",
    display_order: "0",
    subCategories: []
  });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const handleAddDraftSubCategory = () => {
    setCategoryDraft(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, { id: crypto.randomUUID(), name: "", display_order: "0" }]
    }));
  };

  const handleRemoveDraftSubCategory = (id: string) => {
    setCategoryDraft(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(sc => sc.id !== id)
    }));
  };

  const handleDraftSubCategoryChange = (id: string, field: keyof SubCategoryDraft, value: string) => {
    setCategoryDraft(prev => ({
      ...prev,
      subCategories: prev.subCategories.map(sc => sc.id === id ? { ...sc, [field]: value } : sc)
    }));
  };

  const handleSaveCategoryStructure = async () => {
    if (!categoryDraft.name.trim()) return;
    setCategorySubmitting(true);
    try {
      const newCat = await pqmService.createDropdownOption({
        name: categoryDraft.name,
        field_type: "CATEGORY",
        display_order: parseInt(categoryDraft.display_order) || 0,
        is_active: true
      });

      const validSubCats = categoryDraft.subCategories.filter(sc => sc.name.trim());
      if (validSubCats.length > 0) {
        await Promise.all(validSubCats.map(sc => 
          pqmService.createDropdownOption({
            name: sc.name.trim(),
            field_type: "SUB_CATEGORY",
            display_order: parseInt(sc.display_order) || 0,
            system_mapping: newCat.id,
            is_active: true
          })
        ));
      }

      setCategoryDraft({ name: "", display_order: "0", subCategories: [] });
      await fetchDropdownConfig();
    } catch (e) {
      console.error("Failed to create category structure");
      alert("Failed to create category structure.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);

  const handleUpdateSubCategory = async (id: string) => {
    if (!subCategoryForm.name.trim()) return;
    try {
      await pqmService.updateDropdownOption(id, {
        name: subCategoryForm.name,
        display_order: parseInt(subCategoryForm.display_order) || 0,
      });
      setEditingSubCategoryId(null);
      setSubCategoryForm({ name: "", display_order: "0" });
      await fetchDropdownConfig();
    } catch(e) {
      console.error("Failed to update sub-category");
      alert("Failed to update sub-category.");
    }
  };

  const deleteDropdownOption = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this option?")) return;
    try {
      await pqmService.deleteDropdownOption(id);
      await fetchDropdownConfig();
    } catch(e) {
      console.error("Failed to delete dropdown option");
      alert("Failed to delete option.");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 w-full max-w-7xl mx-auto min-h-screen pb-20">
      <PageHeader
        title="PQM Settings"
        subtitle="Manage dynamic configurations and dropdowns"
        icon={Settings}
      />

      {/* ── Main Tabs (Segmented Control) ── */}
      <div className="inline-flex items-center p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl w-fit shadow-inner">
        {(["dropdowns", "contractors"] as ConfigTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out ${
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-violet-700 dark:text-violet-400 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Dropdowns ── */}
        {activeTab === "dropdowns" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
            
            {/* Dropdown Type Navigation */}
            <div className="inline-flex flex-wrap items-center p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm gap-1 w-full sm:w-auto">
              {(["priority", "severity", "reference_type", "area", "category"] as DropdownFieldType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDropdownTab(tab)}
                  className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    activeDropdownTab === tab
                      ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {tab === 'category' ? 'CATEGORIES' : tab.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <SectionCard title={`${activeDropdownTab === 'category' ? 'Categories' : activeDropdownTab.replace('_', ' ').charAt(0).toUpperCase() + activeDropdownTab.replace('_', ' ').slice(1)} Settings`}>
              
              <div className="flex items-center gap-3 mb-8 p-4 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-xl">
                <InfoTooltip content={getDropdownTooltip(activeDropdownTab)} />
                <span className="text-sm font-medium text-violet-900 dark:text-violet-200">
                  {getDropdownTooltip(activeDropdownTab)}
                </span>
              </div>

              {/* Form Area */}
              {activeDropdownTab === 'category' && !editingDdId ? (
                <div className="mb-10 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-violet-500" />
                    Create New Category Structure
                  </h3>
                  
                  {/* Category Details */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[250px]">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category Name</label>
                      <input 
                        className="w-full h-11 px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm shadow-sm focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                        placeholder="e.g. Civil Works"
                        value={categoryDraft.name}
                        onChange={e => setCategoryDraft(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Order</label>
                      <input 
                        type="number"
                        className="w-full h-11 px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm shadow-sm focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                        value={categoryDraft.display_order}
                        onChange={e => setCategoryDraft(prev => ({ ...prev, display_order: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Sub-categories list */}
                  <div className="space-y-3 mb-6 pl-4 border-l-[3px] border-violet-100 dark:border-violet-900/30 ml-2">
                    {categoryDraft.subCategories.map((sc, index) => (
                      <div key={sc.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                        <CornerDownRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
                        <input 
                          className="flex-1 h-10 px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm shadow-sm focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all"
                          placeholder={`Sub-category ${index + 1}`}
                          value={sc.name}
                          onChange={e => handleDraftSubCategoryChange(sc.id, 'name', e.target.value)}
                          autoFocus
                        />
                        <input 
                          type="number"
                          className="w-24 h-10 px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm shadow-sm outline-none transition-all focus:bg-white dark:focus:bg-gray-900"
                          placeholder="Order"
                          value={sc.display_order}
                          onChange={e => handleDraftSubCategoryChange(sc.id, 'display_order', e.target.value)}
                        />
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          onClick={() => handleRemoveDraftSubCategory(sc.id)}
                          title="Remove Sub-category"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-semibold inline-flex items-center gap-1.5 mt-2 pl-9 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                      onClick={handleAddDraftSubCategory}
                    >
                      <Plus className="w-4 h-4" />
                      Add Sub-category
                    </button>
                  </div>

                  <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-5 mt-4">
                    <button 
                      className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md"
                      onClick={handleSaveCategoryStructure}
                      disabled={categorySubmitting || !categoryDraft.name.trim()}
                    >
                      {categorySubmitting ? "Saving..." : "Save Category Structure"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 mb-10 p-5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                  <input 
                    className="flex-1 min-w-[200px] h-11 px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
                    placeholder={activeDropdownTab === 'category' ? "Category name" : "Option name"}
                    value={ddForm.name} 
                    onChange={e => setDdForm(f => ({ ...f, name: e.target.value }))} 
                  />
                  <input 
                    className="w-28 h-11 px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
                    placeholder="Order" 
                    type="number"
                    value={ddForm.display_order} 
                    onChange={e => setDdForm(f => ({ ...f, display_order: e.target.value }))} 
                  />
                  <button 
                    className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50" 
                    onClick={handleDropdownSubmit} 
                    disabled={ddSubmitting}
                  >
                    <Plus className="w-4 h-4" />
                    {ddSubmitting ? "Saving…" : (editingDdId ? "Update Option" : "Add Option")}
                  </button>
                  {editingDdId && (
                    <button 
                      className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm" 
                      onClick={cancelDdEdit} 
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                </div>
              )}
              
              {/* List Area */}
              <div className="flex flex-col gap-3">
                {getActiveDropdownList().length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    No options configured yet.
                  </div>
                ) : (
                  getActiveDropdownList().map((opt: PQMDropdownOption) => (
                    <div key={opt.id} className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      {/* Main Row */}
                      <div 
                        className={`flex items-center justify-between p-4 group ${activeDropdownTab === 'category' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
                        onClick={() => activeDropdownTab === 'category' && toggleCategory(opt.id)}
                      >
                        <div className="flex items-center gap-4">
                          {activeDropdownTab === 'category' && (
                            <div className="text-gray-400">
                              {expandedCategories.has(opt.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </div>
                          )}
                          <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
                            {opt.display_order}
                          </Badge>
                          <span className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            {opt.name}
                          </span>
                          {activeDropdownTab === 'category' && (
                            <Badge variant="outline" className="ml-2 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800">
                              {subCategories.filter(sc => sc.system_mapping === opt.id).length} sub-categories
                            </Badge>
                          )}
                        </div>
                        <div 
                          className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          {activeDropdownTab === 'category' && (
                            <button 
                              className="p-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                              onClick={() => {
                                setAddingSubCategoryTo(opt.id);
                                setExpandedCategories(prev => new Set(prev).add(opt.id));
                              }}
                              title="Add Sub-category"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            onClick={() => startDdEdit(opt)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            onClick={() => deleteDropdownOption(opt.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Sub-categories block (only for category tab) */}
                      {activeDropdownTab === 'category' && expandedCategories.has(opt.id) && (
                        <div className="flex flex-col bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 rounded-b-xl overflow-hidden">
                          {subCategories.filter(sc => sc.system_mapping === opt.id).map(sc => (
                            <div key={sc.id} className="flex items-center justify-between p-3 pl-14 group border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition-colors">
                              {editingSubCategoryId === sc.id ? (
                                <div className="flex items-center gap-3 w-full animate-in fade-in">
                                  <CornerDownRight className="w-4 h-4 text-violet-400 shrink-0" />
                                  <input 
                                    className="flex-1 h-9 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                                    placeholder="Sub-category name"
                                    value={subCategoryForm.name}
                                    onChange={e => setSubCategoryForm(f => ({ ...f, name: e.target.value }))}
                                    autoFocus
                                  />
                                  <input 
                                    className="w-20 h-9 px-3 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm outline-none"
                                    placeholder="Order"
                                    type="number"
                                    value={subCategoryForm.display_order}
                                    onChange={e => setSubCategoryForm(f => ({ ...f, display_order: e.target.value }))}
                                  />
                                  <button 
                                    className="h-9 px-4 inline-flex items-center justify-center bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                                    onClick={() => handleUpdateSubCategory(sc.id)}
                                  >
                                    Save
                                  </button>
                                  <button 
                                    className="h-9 px-4 inline-flex items-center justify-center bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                    onClick={() => { setEditingSubCategoryId(null); setSubCategoryForm({ name: "", display_order: "0" }); }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3">
                                    <CornerDownRight className="w-4 h-4 text-gray-400" />
                                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-[10px] text-gray-500">
                                      {sc.display_order}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {sc.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                      onClick={() => {
                                        setEditingSubCategoryId(sc.id);
                                        setSubCategoryForm({ name: sc.name, display_order: String(sc.display_order) });
                                      }}
                                      title="Edit Sub-category"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                      onClick={() => deleteDropdownOption(sc.id)}
                                      title="Delete Sub-category"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          
                          {/* Inline Add Form for Sub-category */}
                          {addingSubCategoryTo === opt.id && (
                            <div className="flex items-center gap-3 p-3 pl-14 bg-violet-50/50 dark:bg-violet-900/10 border-t border-violet-100 dark:border-violet-900/30 animate-in fade-in slide-in-from-top-1">
                              <CornerDownRight className="w-4 h-4 text-violet-500 shrink-0" />
                              <input 
                                className="flex-1 h-9 px-3 py-1 bg-white dark:bg-gray-950 border border-violet-200 dark:border-violet-800 rounded-lg text-sm shadow-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                                placeholder="New sub-category name"
                                value={subCategoryForm.name}
                                onChange={e => setSubCategoryForm(f => ({ ...f, name: e.target.value }))}
                                autoFocus
                              />
                              <input 
                                className="w-20 h-9 px-3 py-1 bg-white dark:bg-gray-950 border border-violet-200 dark:border-violet-800 rounded-lg text-sm shadow-sm outline-none"
                                placeholder="Order"
                                type="number"
                                value={subCategoryForm.display_order}
                                onChange={e => setSubCategoryForm(f => ({ ...f, display_order: e.target.value }))}
                              />
                              <button 
                                className="h-9 px-4 inline-flex items-center justify-center bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                                onClick={() => handleSubCategorySubmit(opt.id)}
                              >
                                Save
                              </button>
                              <button 
                                className="h-9 px-4 inline-flex items-center justify-center bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                onClick={() => { setAddingSubCategoryTo(null); setSubCategoryForm({ name: "", display_order: "0" }); }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        )}


        {/* ── Contractors ── */}
        {activeTab === "contractors" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-6">
            <SectionCard title="Contractors">
              <div className="flex flex-wrap items-center gap-3 mb-10 p-5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl">
                <input 
                  className="flex-1 min-w-[200px] h-11 px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
                  placeholder="Company name"
                  value={ctForm.name} 
                  onChange={e => setCtForm(f => ({ ...f, name: e.target.value }))} 
                />
                <input 
                  className="flex-1 min-w-[150px] h-11 px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
                  placeholder="Contact person"
                  value={ctForm.contact_person} 
                  onChange={e => setCtForm(f => ({ ...f, contact_person: e.target.value }))} 
                />
                <input 
                  className="flex-1 min-w-[150px] h-11 px-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all" 
                  placeholder="Contact email" type="email"
                  value={ctForm.contact_email} 
                  onChange={e => setCtForm(f => ({ ...f, contact_email: e.target.value }))} 
                />
                <button 
                  className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50" 
                  onClick={handleContractorSubmit} 
                  disabled={ctSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  {ctSubmitting ? "Saving…" : (editingCtId ? "Update Contractor" : "Add Contractor")}
                </button>
                {editingCtId && (
                  <button 
                    className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm" 
                    onClick={cancelCtEdit} 
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                {contractors.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
                    No contractors configured yet.
                  </div>
                ) : (
                  contractors.map((c: any) => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company Name</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Person</span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{c.contact_person || <span className="italic opacity-50">N/A</span>}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Email</span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{c.contact_email || <span className="italic opacity-50">N/A</span>}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button 
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          onClick={() => startCtEdit(c)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          onClick={() => deleteContractor(c.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

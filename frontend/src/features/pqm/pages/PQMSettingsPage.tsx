import React, { useEffect, useState } from "react";
import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/platform/SectionCard";
import { Settings, Plus, Trash2, Edit2, X, CornerDownRight, FolderPlus } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      <PageHeader
        title="PQM Settings"
        subtitle="Manage dynamic configurations and dropdowns"
        icon={Settings}
      />

      {/* ── Tabs ── */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg w-fit">
        {(["dropdowns", "contractors"] as ConfigTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {/* ── Dropdowns ── */}
        {activeTab === "dropdowns" && (
          <SectionCard title="Manage Dropdown Fields">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg w-fit mb-6">
                {(["priority", "severity", "reference_type", "area", "category"] as DropdownFieldType[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveDropdownTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeDropdownTab === tab
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {tab === 'category' ? 'CATEGORIES' : tab.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {activeDropdownTab === 'category' ? 'CATEGORIES' : activeDropdownTab.replace('_', ' ').toUpperCase()} Options
                </span>
                <InfoTooltip content={getDropdownTooltip(activeDropdownTab)} />
              </div>

            {activeDropdownTab === 'category' && !editingDdId ? (
              <div className="mb-8 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-violet-500" />
                  Create New Category Structure
                </h3>
                
                {/* Category Details */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[250px]">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                    <input 
                      className="w-full h-10 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="e.g. Civil Works"
                      value={categoryDraft.name}
                      onChange={e => setCategoryDraft(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
                    <input 
                      type="number"
                      className="w-full h-10 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      value={categoryDraft.display_order}
                      onChange={e => setCategoryDraft(prev => ({ ...prev, display_order: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Sub-categories list */}
                <div className="space-y-3 mb-5 pl-2 border-l-2 border-violet-100 dark:border-violet-900/30 ml-2">
                  {categoryDraft.subCategories.map((sc, index) => (
                    <div key={sc.id} className="flex items-center gap-3">
                      <CornerDownRight className="w-4 h-4 text-gray-400 shrink-0" />
                      <input 
                        className="flex-1 h-9 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm shadow-sm focus:ring-1 focus:ring-violet-500 outline-none"
                        placeholder={`Sub-category ${index + 1}`}
                        value={sc.name}
                        onChange={e => handleDraftSubCategoryChange(sc.id, 'name', e.target.value)}
                        autoFocus
                      />
                      <input 
                        type="number"
                        className="w-20 h-9 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm shadow-sm outline-none"
                        placeholder="Order"
                        value={sc.display_order}
                        onChange={e => handleDraftSubCategoryChange(sc.id, 'display_order', e.target.value)}
                      />
                      <button 
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => handleRemoveDraftSubCategory(sc.id)}
                        title="Remove Sub-category"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium inline-flex items-center gap-1 mt-2 pl-7"
                    onClick={handleAddDraftSubCategory}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Sub-category
                  </button>
                </div>

                <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                  <button 
                    className="h-10 px-5 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold rounded-md hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
                    onClick={handleSaveCategoryStructure}
                    disabled={categorySubmitting || !categoryDraft.name.trim()}
                  >
                    {categorySubmitting ? "Saving..." : "Save Category Structure"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <input 
                  className="flex-1 min-w-[200px] h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                  placeholder={activeDropdownTab === 'category' ? "Category name" : "Option name"}
                  value={ddForm.name} 
                  onChange={e => setDdForm(f => ({ ...f, name: e.target.value }))} 
                />
                <input 
                  className="w-24 h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                  placeholder="Order" 
                  type="number"
                  value={ddForm.display_order} 
                  onChange={e => setDdForm(f => ({ ...f, display_order: e.target.value }))} 
                />
                <button 
                  className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold rounded-md hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50" 
                  onClick={handleDropdownSubmit} 
                  disabled={ddSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  {ddSubmitting ? "Saving…" : (editingDdId ? "Update Option" : "Add Option")}
                </button>
                {editingDdId && (
                  <button 
                    className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 transition-colors shadow-sm" 
                    onClick={cancelDdEdit} 
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            )}
            
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {getActiveDropdownList().length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No options configured yet.</td>
                    </tr>
                  ) : (
                    getActiveDropdownList().map((opt: PQMDropdownOption) => (
                      <React.Fragment key={opt.id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {opt.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {opt.display_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {activeDropdownTab === 'category' && (
                                <button 
                                  className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300 mr-4"
                                  onClick={() => setAddingSubCategoryTo(opt.id)}
                                  title="Add Sub-category"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 mr-4"
                              onClick={() => startDdEdit(opt)}
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                              onClick={() => deleteDropdownOption(opt.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        
                        {/* Sub-categories rendering for Categories tab */}
                        {activeDropdownTab === 'category' && (
                            <>
                              {subCategories.filter(sc => sc.system_mapping === opt.id).map(sc => (
                                <React.Fragment key={sc.id}>
                                  {editingSubCategoryId === sc.id ? (
                                    <tr className="bg-violet-50/50 dark:bg-violet-900/10">
                                      <td colSpan={3} className="px-6 py-3 pl-12">
                                        <div className="flex items-center gap-3">
                                          <CornerDownRight className="w-4 h-4 text-violet-400" />
                                          <input 
                                            className="w-64 h-8 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm"
                                            placeholder="Sub-category name"
                                            value={subCategoryForm.name}
                                            onChange={e => setSubCategoryForm(f => ({ ...f, name: e.target.value }))}
                                            autoFocus
                                          />
                                          <input 
                                            className="w-16 h-8 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm"
                                            placeholder="Order"
                                            type="number"
                                            value={subCategoryForm.display_order}
                                            onChange={e => setSubCategoryForm(f => ({ ...f, display_order: e.target.value }))}
                                          />
                                          <button 
                                            className="h-8 px-3 inline-flex items-center justify-center bg-violet-600 text-white text-xs font-semibold rounded-md hover:bg-violet-700"
                                            onClick={() => handleUpdateSubCategory(sc.id)}
                                          >
                                            Update
                                          </button>
                                          <button 
                                            className="h-8 px-3 inline-flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-300"
                                            onClick={() => { setEditingSubCategoryId(null); setSubCategoryForm({ name: "", display_order: "0" }); }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 pl-12 flex items-center gap-2">
                                        <CornerDownRight className="w-4 h-4 text-gray-400" />
                                        {sc.name}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500">
                                        {sc.display_order}
                                      </td>
                                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                          className="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 mr-4"
                                          onClick={() => {
                                            setEditingSubCategoryId(sc.id);
                                            setSubCategoryForm({ name: sc.name, display_order: String(sc.display_order) });
                                          }}
                                          title="Edit Sub-category"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                                          onClick={() => deleteDropdownOption(sc.id)}
                                          title="Delete Sub-category"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                              
                              {/* Inline Add Form for Sub-category */}
                              {addingSubCategoryTo === opt.id && (
                                <tr className="bg-violet-50/50 dark:bg-violet-900/10">
                                  <td colSpan={3} className="px-6 py-3 pl-12">
                                    <div className="flex items-center gap-3">
                                      <CornerDownRight className="w-4 h-4 text-violet-400" />
                                      <input 
                                        className="w-64 h-8 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm"
                                        placeholder="Sub-category name"
                                        value={subCategoryForm.name}
                                        onChange={e => setSubCategoryForm(f => ({ ...f, name: e.target.value }))}
                                        autoFocus
                                      />
                                      <input 
                                        className="w-16 h-8 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm"
                                        placeholder="Order"
                                        type="number"
                                        value={subCategoryForm.display_order}
                                        onChange={e => setSubCategoryForm(f => ({ ...f, display_order: e.target.value }))}
                                      />
                                      <button 
                                        className="h-8 px-3 inline-flex items-center justify-center bg-violet-600 text-white text-xs font-semibold rounded-md hover:bg-violet-700"
                                        onClick={() => handleSubCategorySubmit(opt.id)}
                                      >
                                        Save
                                      </button>
                                      <button 
                                        className="h-8 px-3 inline-flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-300"
                                        onClick={() => { setAddingSubCategoryTo(null); setSubCategoryForm({ name: "", display_order: "0" }); }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}


        {/* ── Contractors ── */}
        {activeTab === "contractors" && (
          <SectionCard title="Contractors">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <input 
                className="flex-1 min-w-[200px] h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                placeholder="Company name"
                value={ctForm.name} 
                onChange={e => setCtForm(f => ({ ...f, name: e.target.value }))} 
              />
              <input 
                className="flex-1 min-w-[150px] h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                placeholder="Contact person"
                value={ctForm.contact_person} 
                onChange={e => setCtForm(f => ({ ...f, contact_person: e.target.value }))} 
              />
              <input 
                className="flex-1 min-w-[150px] h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                placeholder="Contact email" type="email"
                value={ctForm.contact_email} 
                onChange={e => setCtForm(f => ({ ...f, contact_email: e.target.value }))} 
              />
              <button 
                className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold rounded-md hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50" 
                onClick={handleContractorSubmit} 
                disabled={ctSubmitting}
              >
                <Plus className="w-4 h-4" />
                {ctSubmitting ? "Saving…" : (editingCtId ? "Update Contractor" : "Add Contractor")}
              </button>
              {editingCtId && (
                <button 
                  className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300 transition-colors shadow-sm" 
                  onClick={cancelCtEdit} 
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
            
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Email</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {contractors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No contractors configured yet.</td>
                    </tr>
                  ) : (
                    contractors.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {c.contact_person || <span className="text-gray-400 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {c.contact_email || <span className="text-gray-400 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 mr-4"
                            onClick={() => startCtEdit(c)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"
                            onClick={() => deleteContractor(c.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}

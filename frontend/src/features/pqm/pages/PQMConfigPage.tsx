// yss_orbit/frontend/src/features/pqm/pages/PQMConfigPage.tsx
import React, { useEffect, useState } from "react";
import { usePqmStore } from "../store/usePqmStore";
import { pqmService } from "../api/pqmService";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/platform/SectionCard";
import { Settings, Plus } from "lucide-react";

type ConfigTab = "categories" | "contractors" | "escalation";

export default function PQMConfigPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("categories");
  const { categories, contractors, fetchConfig } = usePqmStore();
  const [escalationConfig, setEscalationConfig] = useState<any[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  // ── Category management ─────────────────────────────────────────────────────
  const [catForm, setCatForm] = useState({ name: "", display_order: "0" });
  const [catSubmitting, setCatSubmitting] = useState(false);

  const createCategory = async () => {
    if (!catForm.name.trim()) return;
    setCatSubmitting(true);
    try {
      await pqmService.createDropdownOption({ name: catForm.name, display_order: parseInt(catForm.display_order), field_type: "category", is_active: true });
      setCatForm({ name: "", display_order: "0" });
      await fetchConfig();
    } finally { setCatSubmitting(false); }
  };

  // ── Contractor management ────────────────────────────────────────────────────
  const [ctForm, setCtForm] = useState({ name: "", contact_person: "", contact_email: "" });
  const [ctSubmitting, setCtSubmitting] = useState(false);

  const createContractor = async () => {
    if (!ctForm.name.trim()) return;
    setCtSubmitting(true);
    try {
      await pqmService.createContractor(ctForm);
      setCtForm({ name: "", contact_person: "", contact_email: "" });
      await fetchConfig();
    } finally { setCtSubmitting(false); }
  };

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
      <PageHeader
        title="PQM Configuration"
        subtitle="Manage categories, contractors, and SLA settings"
        icon={Settings}
      />

      {/* ── Tabs ── */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg w-fit">
        {(["categories", "contractors", "escalation"] as ConfigTab[]).map(tab => (
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
        {/* ── Categories ── */}
        {activeTab === "categories" && (
          <SectionCard title="NC Categories">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <input 
                className="flex-1 min-w-[200px] h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                placeholder="Category name"
                value={catForm.name} 
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} 
              />
              <input 
                className="w-24 h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                placeholder="Order" 
                type="number"
                value={catForm.display_order} 
                onChange={e => setCatForm(f => ({ ...f, display_order: e.target.value }))} 
              />
              <button 
                className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold rounded-md hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50" 
                onClick={createCategory} 
                disabled={catSubmitting}
              >
                <Plus className="w-4 h-4" />
                {catSubmitting ? "Adding…" : "Add Category"}
              </button>
            </div>
            
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Categories</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">No categories configured yet.</td>
                    </tr>
                  ) : (
                    categories.map((cat: any) => (
                      <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {cat.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {(cat.children ?? []).length > 0 ? (
                            <ul className="list-disc pl-4">
                              {(cat.children ?? []).map((child: any) => (
                                <li key={child.id}>{child.name}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </td>
                      </tr>
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
                onClick={createContractor} 
                disabled={ctSubmitting}
              >
                <Plus className="w-4 h-4" />
                {ctSubmitting ? "Adding…" : "Add Contractor"}
              </button>
            </div>
            
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {contractors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No contractors configured yet.</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ── Escalation Config ── */}
        {activeTab === "escalation" && (
          <SectionCard 
            title="SLA & Escalation Rules" 
            description="Configure SLA days and escalation thresholds per priority level."
          >
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Day 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Day 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Day 3</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {["Critical", "High", "Medium", "Low"].map(p => (
                    <tr key={p} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {p}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {p === "Critical" ? 2 : p === "High" ? 5 : p === "Medium" ? 10 : 20}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">—</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">—</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-gray-500">Full SLA configuration management coming in Phase 2.</p>
          </SectionCard>
        )}
      </div>
    </div>
  );
}


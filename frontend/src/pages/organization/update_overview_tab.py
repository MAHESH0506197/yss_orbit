import re

def update_ui():
    filepath = r"c:\PROJECT\yss_orbit\frontend\src\pages\organization\organizationDetailPage.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_overview = """      {/* ── Overview Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="pt-6 grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Contact & Identity */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <Mail className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Contact & Identity</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-5">
              {org.email && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Email Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{org.email}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="group flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Globe2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Slug / Handle</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{org.slug}</span>
                  </div>
                </div>
              </div>
              <div className="group flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Organization ID</p>
                  <p className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 truncate" title={org.id}>{org.id}</p>
                </div>
              </div>
              {domain && (
                <div className="group flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 transition-colors">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Business Domain</p>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      {domain.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Calendar className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Lifecycle & Timeline</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-800/80 rounded-full" />
              
              {org.created_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 ring-4 ring-white dark:ring-gray-900">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-0.5">Created At</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{format(new Date(org.created_at), 'dd MMM yyyy')}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{format(new Date(org.created_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
              {org.updated_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 ring-4 ring-white dark:ring-gray-900">
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 mb-0.5">Last Updated</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDistanceToNow(new Date(org.updated_at), { addSuffix: true })}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{format(new Date(org.updated_at), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                </div>
              )}
              {org.deleted_at && (
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 ring-4 ring-white dark:ring-gray-900">
                    <Archive className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 mb-0.5">Archived At</p>
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{format(new Date(org.deleted_at), 'dd MMM yyyy')}</p>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">{format(new Date(org.deleted_at), 'h:mm a')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 shadow-inner">
                  <Zap className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Platform Stats</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-5 p-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100/50 dark:border-violet-800/30">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                  <GitBranch className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Business Units</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black ${(org.business_units_count ?? 0) > 0 ? 'text-violet-700 dark:text-violet-400' : 'text-gray-400'}`}>
                      {org.business_units_count ?? 0}
                    </span>
                    {(org.business_units_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-full px-2.5 py-1">
                        <Activity className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isProtected && (
                <div className="flex items-start gap-3 rounded-xl border border-orange-200/60 dark:border-orange-800/50 bg-orange-50/80 dark:bg-orange-900/15 p-4 shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Archive Protected</p>
                    <p className="text-xs text-orange-700/80 dark:text-orange-300/70 mt-1 leading-relaxed font-medium">Has <strong className="text-orange-700 dark:text-orange-300">{org.business_units_count} active</strong> Business Unit(s). Remove all BUs before archiving.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}"""

    pattern = re.compile(r"\{\/\* ── Overview Tab ───.*?(?=\{\/\* ── Settings Tab ───)", re.DOTALL | re.IGNORECASE)
    match = pattern.search(content)
    
    if match:
        new_content = content[:match.start()] + new_overview + "\n      " + content[match.end():]
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Overview updated successfully")
    else:
        print("Could not find Overview Tab section to replace")

if __name__ == "__main__":
    update_ui()

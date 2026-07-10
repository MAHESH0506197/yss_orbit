import re

def update_ui():
    filepath = r"c:\PROJECT\yss_orbit\frontend\src\pages\organization\organizationDetailPage.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_hero = """      {/* ── Hero Section (Premium UI Upgrade) ─────────────────────────────── */}
      <div className="relative rounded-[2rem] bg-white dark:bg-gray-900 shadow-sm border border-gray-200/60 dark:border-gray-800/60 mb-8 mt-4 overflow-hidden flex flex-col">
        
        {/* Rich Gradient Header Background */}
        <div className="relative pt-10 px-6 pb-16 md:px-10 md:pb-20 w-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 dark:opacity-5 mix-blend-overlay"></div>
          {/* Decorative mesh shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[30rem] h-[30rem] bg-white/20 dark:bg-violet-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[20rem] h-[20rem] bg-indigo-900/40 dark:bg-indigo-500/10 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            
            {/* Left side: Avatar & Info */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              
              {/* Avatar */}
              <div className="relative shrink-0 self-start md:self-auto">
                {org.logo_url ? (
                  <img
                    src={org.logo_url} alt={org.name}
                    /* ALWAYS use bg-white for logos so transparent logos with dark text don't vanish in dark mode */
                    className="relative h-28 w-28 md:h-32 md:w-32 rounded-3xl border-4 border-white/20 dark:border-gray-700 object-contain bg-white shadow-2xl backdrop-blur-sm"
                  />
                ) : (
                  <div
                    className="relative flex h-28 w-28 md:h-32 md:w-32 items-center justify-center rounded-3xl text-5xl font-black text-white shadow-2xl border-4 border-white/20 dark:border-gray-700 backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
                    }}
                  >
                    {getOrgInitials(org.name)}
                  </div>
                )}
                {/* Status indicator */}
                <div className={`absolute -bottom-2 -right-2 flex items-center gap-1.5 rounded-full px-3 py-1 ring-4 ring-violet-600 dark:ring-gray-800 shadow-md ${status === 'active' ? 'bg-emerald-400' : status === 'inactive' ? 'bg-amber-400' : 'bg-rose-500'}`}>
                  <span className="relative flex h-2.5 w-2.5">
                    {status === 'active' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>}
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
                  </span>
                  <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-sm">{statusCfg.label}</span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    {org.name}
                  </h1>
                  {org.is_deleted && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-rose-500/80 dark:bg-rose-500/50 text-white ring-1 ring-white/30 dark:ring-rose-500/50 backdrop-blur-md">
                      <Archive className="h-3.5 w-3.5" /> Read-only Archived
                    </span>
                  )}
                </div>
                
                {/* Meta tags */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-white dark:text-gray-300 shadow-sm transition-all hover:bg-white/30 dark:hover:bg-gray-700/50">
                    <Globe2 className="h-4 w-4 text-white/80 dark:text-gray-400" /> <span className="font-mono">{org.slug}</span>
                  </div>
                  {domain && (
                    <div className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold text-white dark:text-gray-300 shadow-sm transition-all hover:bg-white/30 dark:hover:bg-gray-700/50">
                      <Layers className="h-4 w-4 text-white/80 dark:text-gray-400" /> {domain.name}
                    </div>
                  )}
                  {org.email && (
                    <a href={`mailto:${org.email}`} className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-white dark:text-gray-300 shadow-sm transition-all hover:bg-white/30 dark:hover:bg-gray-700/50">
                      <Mail className="h-4 w-4 text-white/80 dark:text-gray-400" /> {org.email}
                    </a>
                  )}
                  {org.created_at && (
                    <div className="flex items-center gap-1.5 bg-white/20 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 dark:text-gray-300 shadow-sm">
                      <Calendar className="h-4 w-4 text-white/80 dark:text-gray-400" /> Since {format(new Date(org.created_at), 'MMM yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex shrink-0 items-center gap-3 self-start md:self-auto">
              {!org.is_deleted && (
                <PermissionGate permission="organization.organization.view">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-indigo-700 dark:text-gray-200 shadow-lg hover:bg-white dark:hover:bg-gray-700 hover:-translate-y-0.5 transition-all"
                  >
                    <Edit2 className="h-4 w-4" /> Edit Profile
                  </button>
                </PermissionGate>
              )}
              {org.is_deleted ? (
                <button
                  onClick={() => setConfirmDialog({ type: 'restore' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white border border-emerald-400 dark:border-emerald-500 shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <RotateCcw className="h-4 w-4" /> Restore
                </button>
              ) : isProtected ? (
                <button
                  onClick={() => toast.error(`Cannot archive: org has ${org.business_units_count} active Business Unit(s).`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border border-white/30 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-white/70 dark:text-gray-500 cursor-not-allowed"
                >
                  <ShieldAlert className="h-4 w-4" /> Archive Protected
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDialog({ type: 'archive' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-400 dark:bg-rose-600 dark:hover:bg-rose-500 border border-rose-400 dark:border-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Archive className="h-4 w-4" /> Archive
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Strip Container ─────────────────────────────────────────── */}
        <div className="relative z-20 px-6 md:px-10 bg-white dark:bg-gray-900 rounded-t-[2rem] -mt-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 py-8">
            {[
              { label: 'Business Units', value: org.business_units_count ?? 0, icon: GitBranch, color: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-50 dark:bg-violet-900/40' },
              { label: 'Status', value: statusCfg.label, icon: Activity, color: statusCfg.text.split(' ')[0], iconBg: statusCfg.bg },
              { label: 'Created', value: org.created_at ? format(new Date(org.created_at), 'dd MMM yyyy') : '—', icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/40' },
              { label: 'Last Updated', value: org.updated_at ? formatDistanceToNow(new Date(org.updated_at), { addSuffix: true }) : '—', icon: RefreshCcw, color: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/40' },
            ].map((kpi, i) => (
              <div key={i} className={`flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 px-5 py-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{kpi.label}</p>
                  <p className={`text-lg font-black ${kpi.color} truncate`}>{String(kpi.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
"""

    pattern = re.compile(r"\{\/\* ── Hero Section \(Premium UI Upgrade\) ───.*?(?=\{\/\* ── Sticky Tabs ───)", re.DOTALL | re.IGNORECASE)
    match = pattern.search(content)
    
    if match:
        new_content = content[:match.start()] + new_hero + "\n      " + content[match.end():]
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated successfully")
    else:
        print("Could not find Hero Section to replace")

if __name__ == "__main__":
    update_ui()

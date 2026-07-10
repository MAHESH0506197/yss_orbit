import re

def update_ui():
    filepath = r"c:\PROJECT\yss_orbit\frontend\src\pages\organization\organizationDetailPage.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_settings = """      {/* ── Settings Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        org.settings ? (
          <div className="pt-6 space-y-6">

            {/* Branding */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 shadow-inner">
                    <Palette className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Branding</h3>
                </div>
                <Link to={`/platform/organizations/${org.id}/settings`} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Edit2 className="h-3 w-3" /> Edit
                </Link>
              </div>
              <div className="p-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Logo */}
                <div className="group flex items-start gap-4">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="Logo" className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white border-2 border-gray-100 dark:border-gray-800 shadow-sm transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-105">
                      <Palette className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Logo</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{org.logo_url ? 'Custom Uploaded' : 'Default Initials'}</p>
                  </div>
                </div>
                
                {/* Theme Color */}
                <div className="group flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-black/5 transition-transform group-hover:scale-105" style={{ background: org.settings.theme_color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Theme Color</p>
                    <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{org.settings.theme_color}</p>
                  </div>
                </div>
                
                {/* Domain */}
                <div className="group flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 shadow-sm transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Active Domain</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                      {org.settings.custom_domain || `${org.slug}.yssorbit.com`}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                      {org.settings.custom_domain ? 'Custom domain linked' : 'Default workspace domain'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Compliance */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 shadow-inner">
                    <ShieldCheck className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Security & Compliance</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SettingRow icon={Lock} label="Multi-Factor Auth" description="Required for all users" value={org.settings.require_mfa} color="violet" />
                  <SettingRow icon={Activity} label="Audit Logging" description="Track all user actions" value={org.settings.enable_audit_log} color="blue" />
                  <SettingRow icon={Wifi} label="API Access" description="Allow API key generation" value={org.settings.enable_api_access} color="emerald" />
                </div>
                
                {/* Secondary metrics */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="group flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Session Timeout</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-100">{org.settings.session_timeout_minutes} <span className="text-xs font-semibold text-gray-500">minutes</span></p>
                    </div>
                  </div>
                  
                  <div className="group flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">Max Users Limit</p>
                      <p className="text-base font-black text-gray-800 dark:text-gray-100">
                        {org.settings.max_users ?? <span className="text-emerald-500">Unlimited</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-[1.5rem] border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gray-50/50 dark:bg-gray-800/20 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 shadow-inner">
                    <Bell className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">Notification Policies</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SettingRow icon={AlertCircle} label="Login Notifications" description="Alert admins on each new login" value={org.settings.notify_on_login} color="amber" />
                  <SettingRow icon={Zap} label="Data Export Alerts" description="Notify on bulk data exports" value={org.settings.notify_on_data_export} color="blue" />
                </div>
              </div>
            </div>

          </div>
        ) : ("""

    pattern = re.compile(r"\{\/\* ── Settings Tab ───.*?(?=\<div className=\"mt-6 flex flex-col items-center justify-center)", re.DOTALL | re.IGNORECASE)
    match = pattern.search(content)
    
    if match:
        new_content = content[:match.start()] + new_settings + content[match.end():]
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Settings Tab updated successfully")
    else:
        print("Could not find Settings Tab section to replace")

if __name__ == "__main__":
    update_ui()

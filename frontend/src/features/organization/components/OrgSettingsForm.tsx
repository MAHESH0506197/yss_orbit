// yss_orbit/frontend/src/modules/organization/components/OrgSettingsForm.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Shield, Bell, Palette, ArrowUpRight, Clock, Users } from 'lucide-react';
import type { Organization } from '../types/organizationTypes';

interface Props {
  org: Organization;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      on
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
    }`}>
      {on ? 'Enabled' : 'Disabled'}
    </span>
  );
}

export const OrgSettingsForm: React.FC<Props> = ({ org }) => {
  const s = org.settings;
  if (!s) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
            <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          </div>
          Settings Snapshot
        </h3>
        <Link
          to={`/platform/organizations/${org.id}/settings`}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
        >
          Edit All <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>



      {/* Security */}
      <div className="mb-3 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Shield className="h-3 w-3" /> Security
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        <Row label="Multi-Factor Auth"  value={<Toggle on={s.require_mfa} />} />
        <Row label="Audit Log"          value={<Toggle on={s.enable_audit_log} />} />
        <Row label="API Access"         value={<Toggle on={s.enable_api_access} />} />
        <Row
          label="Session Timeout"
          value={
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />{s.session_timeout_minutes} min
            </span>
          }
        />
        <Row
          label="Max Users"
          value={
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />{s.max_users ?? 'Unlimited'}
            </span>
          }
        />
      </div>

      {/* Notifications */}
      <div className="mb-3 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Bell className="h-3 w-3" /> Notifications
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        <Row label="Login Alerts"       value={<Toggle on={s.notify_on_login} />} />
        <Row label="Export Alerts"      value={<Toggle on={s.notify_on_data_export} />} />
      </div>
    </div>
  );
};

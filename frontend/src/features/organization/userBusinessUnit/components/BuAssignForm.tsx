// yss_orbit\frontend\src\features\userBusinessUnit\components\BuAssignForm.tsx
// FIX-BUG-UBU-FORM: Replaced raw UUID text inputs with production-ready
// async search-as-you-type comboboxes + role dropdown + effective date fields.
// Never loads all records — debounced search queries backend on each keystroke.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, User, Building2, Shield, Calendar, Loader2, ChevronDown, Check } from 'lucide-react';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { useUsers } from '@/features/iam/users/hooks/useUsers';
import { useRoles } from '@/features/iam/rbac/hooks/useRoles';
import type { UserBusinessUnitCreatePayload } from '../types/userBusinessUnitTypes';
import toast from 'react-hot-toast';

export interface BuAssignFormProps {
  onSubmit?: (data: UserBusinessUnitCreatePayload) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

// ─── Generic Search-as-You-Type Combobox ─────────────────────────────────────
interface ComboboxOption { id: string; label: string; sublabel?: string }

function SearchCombobox({
  id, placeholder, icon: Icon, value, onChange, options, isLoading,
  onSearch, emptyText = 'No results found',
}: {
  id: string;
  placeholder: string;
  icon: React.ElementType;
  value: ComboboxOption | null;
  onChange: (opt: ComboboxOption | null) => void;
  options: ComboboxOption[];
  isLoading: boolean;
  onSearch: (q: string) => void;
  emptyText?: string;
}) {
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    onSearch(q);
    if (!open) setOpen(true);
  }, [onSearch, open]);

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt);
    setQuery(opt.label);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`relative flex items-center rounded-xl border transition-all ${
        open ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-gray-200 dark:border-gray-700'
      } bg-white dark:bg-gray-900`}>
        <Icon className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value && !open ? value.label : query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { setQuery(''); setOpen(true); onSearch(''); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
          autoComplete="off"
        />
        {isLoading && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-violet-500" />}
        {value && !open && (
          <button type="button" onClick={handleClear} className="mr-2 rounded-full p-0.5 text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!value && !open && <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-gray-400" />}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">{query ? emptyText : 'Type to search…'}</div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20 ${
                      value?.id === opt.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{opt.label}</div>
                      {opt.sublabel && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{opt.sublabel}</div>}
                    </div>
                    {value?.id === opt.id && <Check className="h-4 w-4 shrink-0 text-violet-600" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export const BuAssignForm: React.FC<BuAssignFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = '',
}) => {
  // ── Async search state ────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [buSearch,   setBuSearch]   = useState('');

  // ── Debounced query state (to avoid triggering on every keystroke) ─────────
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [debouncedBuSearch,   setDebouncedBuSearch]   = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBuSearch(buSearch), 300);
    return () => clearTimeout(t);
  }, [buSearch]);

  // ── API Queries (search-as-you-type, max 20 per call) ─────────────────────
  const { data: usersData,  isFetching: usersLoading  } = useUsers({
    search: debouncedUserSearch || undefined,
    page_size: 20,
    is_active: true,
  });
  const { data: busData, isFetching: busLoading } = useBusinessUnits({
    search: debouncedBuSearch || undefined,
    page_size: 20,
    is_active: true,
  });
  const { data: rolesData } = useRoles({ page_size: 100 });

  // ── Selected values ───────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<{ id: string; label: string; sublabel?: string } | null>(null);
  const [selectedBU,   setSelectedBU]   = useState<{ id: string; label: string; sublabel?: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo,   setEffectiveTo]   = useState('');
  const [error, setError] = useState<string | null>(null);

  // ── Option normalization ──────────────────────────────────────────────────
  const userOptions = (usersData?.results ?? []).map((u: any) => ({
    id:       u.id,
    label:    `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email,
    sublabel: u.email,
  }));

  const buOptions = (busData?.results ?? []).map((bu: any) => ({
    id:       bu.id,
    label:    bu.name,
    sublabel: bu.code ? `Code: ${bu.code}` : undefined,
  }));

  const roleOptions = (() => {
    if (!rolesData) return [];
    const arr = (rolesData as any).results ?? (rolesData as any).data ?? rolesData;
    if (!Array.isArray(arr)) return [];
    if (!selectedBU) return []; // Hide roles if no BU selected to prevent cross-domain mistakes
    
    const buObj = (busData?.results ?? []).find((b: any) => b.id === selectedBU.id);
    if (!buObj) return [];
    
    return arr.filter((r: any) => r.business_unit_id === buObj.id);
  })();

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUser) { setError('Please select a user.'); return; }
    if (!selectedBU)   { setError('Please select a business unit.'); return; }

    if (effectiveTo && effectiveFrom && effectiveTo < effectiveFrom) {
      setError('"Effective To" must be after "Effective From".');
      return;
    }

    const payload: UserBusinessUnitCreatePayload = {
      user:               selectedUser.id,
      businessUnit:       selectedBU.id,
      role:               selectedRole || null,
      isActiveMembership: true,
      effectiveFrom:      effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
      effectiveTo:        effectiveTo   ? new Date(effectiveTo).toISOString()   : null,
    };

    try {
      await onSubmit?.(payload);
      // Reset on success
      setSelectedUser(null); setSelectedBU(null); setSelectedRole('');
      setEffectiveFrom(''); setEffectiveTo('');
    } catch (err: any) {
      const msg = err?.response?.data?.detail
        ?? err?.response?.data?.message
        ?? err?.message
        ?? 'Failed to assign user.';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* User selector */}
      <div className="space-y-1.5">
        <label htmlFor="bu-assign-user" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <User className="h-4 w-4 text-violet-500" />
          User <span className="text-red-500">*</span>
        </label>
        <SearchCombobox
          id="bu-assign-user"
          placeholder="Search by name or email…"
          icon={Search}
          value={selectedUser}
          onChange={setSelectedUser}
          options={userOptions}
          isLoading={usersLoading}
          onSearch={setUserSearch}
          emptyText="No users found matching your search."
        />
        {selectedUser && (
          <p className="pl-1 text-xs text-gray-400">ID: <code className="font-mono">{selectedUser.id}</code></p>
        )}
      </div>

      {/* Business Unit selector */}
      <div className="space-y-1.5">
        <label htmlFor="bu-assign-bu" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Building2 className="h-4 w-4 text-violet-500" />
          Business Unit <span className="text-red-500">*</span>
        </label>
        <SearchCombobox
          id="bu-assign-bu"
          placeholder="Search business units…"
          icon={Search}
          value={selectedBU}
          onChange={setSelectedBU}
          options={buOptions}
          isLoading={busLoading}
          onSearch={setBuSearch}
          emptyText="No business units found."
        />
        {selectedBU && (
          <p className="pl-1 text-xs text-gray-400">ID: <code className="font-mono">{selectedBU.id}</code></p>
        )}
      </div>

      {/* Role selector */}
      <div className="space-y-1.5">
        <label htmlFor="bu-assign-role" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Shield className="h-4 w-4 text-violet-500" />
          Role <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <div className={`relative flex items-center rounded-xl border transition-all border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20`}>
          <Shield className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
          <select
            id="bu-assign-role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none appearance-none cursor-pointer"
          >
            <option value="">No role assigned</option>
            {roleOptions.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Effective Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="bu-assign-from" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-violet-500" />
            Effective From <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="bu-assign-from"
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bu-assign-to" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-violet-500" />
            Effective To <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="bu-assign-to"
            type="date"
            value={effectiveTo}
            min={effectiveFrom || undefined}
            onChange={(e) => setEffectiveTo(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting || !selectedUser || !selectedBU}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-gray-950"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Assigning…</>
          ) : (
            'Assign User'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default BuAssignForm;

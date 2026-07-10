// yss_orbit\frontend\src\modules\userBusinessUnit\components\MembershipTable.tsx
import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import type { UserBusinessUnitMembership } from '../types/userBusinessUnitTypes';
import { formatIST } from '@/utils/date';

export interface MembershipTableProps {
  memberships: UserBusinessUnitMembership[];
  isLoading?: boolean;
  onDeactivate?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {active ? 'Active' : 'Inactive'}
  </span>
);

export const MembershipTable: React.FC<MembershipTableProps> = ({
  memberships,
  isLoading = false,
  onDeactivate,
  onActivate,
  onDelete,
  className = '',
}) => {
  const columns = useMemo<ColumnDef<UserBusinessUnitMembership>[]>(() => [
    {
      accessorKey: 'userFullName',
      header: 'User',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{m.userFullName || '—'}</div>
            <div className="text-xs text-gray-500">{m.userEmail}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'businessUnitName',
      header: 'Business Unit',
      cell: ({ row }) => <div className="text-sm text-gray-700">{row.original.businessUnitName}</div>,
    },
    {
      accessorKey: 'roleName',
      header: 'Role',
      cell: ({ row }) => <div className="text-sm text-gray-500">{row.original.roleName ?? '—'}</div>,
    },
    {
      accessorKey: 'isActiveMembership',
      header: 'Status',
      cell: ({ row }) => <StatusBadge active={row.original.isActiveMembership} />,
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
      cell: ({ row }) => <div className="text-sm text-gray-500">{formatIST(new Date(row.original.joinedAt), 'PPP')}</div>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-2">
            {m.isActiveMembership && onDeactivate && (
              <button
                onClick={() => onDeactivate(m.id)}
                className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
              >
                Deactivate
              </button>
            )}
            {!m.isActiveMembership && onActivate && (
              <button
                onClick={() => onActivate(m.id)}
                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                Activate
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(m.id)}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        );
      },
    },
  ], [onDeactivate, onActivate, onDelete]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10 text-gray-400 animate-pulse">
        Loading memberships...
      </div>
    );
  }

  if (!memberships.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
        <p className="text-sm">No memberships found.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 p-4 ${className}`}>
      <DataTable 
        columns={columns} 
        data={memberships} 
        enableGlobalFilter={true} 
      />
    </div>
  );
};

export default MembershipTable;

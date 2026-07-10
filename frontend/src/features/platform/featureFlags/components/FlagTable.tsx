// yss_orbit\frontend\src\modules\featureFlags\components\FlagTable.tsx
import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FeatureFlag } from '../types/featureFlagsTypes';
import { FlagToggleSwitch } from './FlagToggleSwitch';
import { DataTable } from '@/components/ui/DataTable';

export const FlagTable: React.FC<{ flags: FeatureFlag[], onToggle: (id: any, enabled: boolean) => void }> = ({ flags, onToggle }) => {
  const columns = useMemo<ColumnDef<FeatureFlag>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Flag Name',
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{row.original.name}</span>,
    },
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => <span className="text-sm font-mono text-gray-500">{row.original.key}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.type}</span>,
    },
    {
      id: 'status',
      header: () => <div className="text-right w-full">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <FlagToggleSwitch enabled={row.original.isEnabled} onChange={(enabled) => onToggle(row.original.id, enabled)} />
        </div>
      ),
    },
  ], [onToggle]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <DataTable columns={columns} data={flags} enableGlobalFilter={true} searchKey="name" />
    </div>
  );
};

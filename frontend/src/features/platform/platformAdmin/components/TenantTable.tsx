// yss_orbit\frontend\src\modules\platformAdmin\components\TenantTable.tsx
import React, { useMemo } from 'react';
import { Tenant } from '../types/platformAdminTypes';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';

export const TenantTable: React.FC<{ tenants: Tenant[] }> = ({ tenants }) => {
  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Tenant Name',
        cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.name}</span>,
      },
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => <span className="text-gray-500">{row.original.domain}</span>,
      },
      {
        accessorKey: 'plan',
        header: 'Plan',
        cell: ({ row }) => <span className="text-gray-500">{row.original.plan}</span>,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="text-center">
              <span className={`px-2 py-1 text-xs rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {t.isActive ? 'Active' : 'Suspended'}
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <DataTable columns={columns} data={tenants} enableGlobalFilter={true} searchKey="name" />
    </div>
  );
};

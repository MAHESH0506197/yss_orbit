import React from 'react';
import { StoredFile } from '../types/fileStorageTypes';
import { formatFileSize } from '../utils/fileStorageHelpers';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatIST } from '@/utils/date';

const columns: ColumnDef<StoredFile>[] = [
  {
    accessorKey: 'filename',
    header: 'File Name',
    cell: ({ row }) => (
      <span className="font-medium text-gray-900">
        <Link to={`/admin/files/${(row.original as any).id}`} className="hover:underline">
          {row.original.filename}
        </Link>
      </span>
    ),
  },
  {
    accessorKey: 'sizeBytes',
    header: 'Size',
    cell: ({ row }) => <span className="text-gray-500">{formatFileSize(row.original.sizeBytes)}</span>,
  },
  {
    accessorKey: 'extension',
    header: 'Type',
    cell: ({ row }) => <span className="text-gray-500 uppercase">{row.original.extension}</span>,
  },
  {
    accessorKey: 'uploadedAt',
    header: 'Uploaded',
    cell: ({ row }) => <span className="text-gray-500">{formatIST(new Date(row.original.uploadedAt), 'PPP')}</span>,
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        <a href={row.original.url} className="text-[var(--primary-color)] hover:underline mr-4" target="_blank" rel="noopener noreferrer">Download</a>
        <button className="text-red-600 hover:text-red-900">Delete</button>
      </div>
    ),
  },
];

export const FileTable: React.FC<{ files: StoredFile[] }> = ({ files }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <DataTable
        columns={columns}
        data={files}
        searchKey="filename"
        enableGlobalFilter={true}
      />
    </div>
  );
};

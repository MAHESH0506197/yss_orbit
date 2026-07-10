import { useTranslation } from 'react-i18next';
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { MoreVertical, FileText, Edit } from 'lucide-react';
import { AttendanceRecord } from '@/features/hrms/types/attendanceTypes';
import { useAuthStore } from '@/store/authStore';

interface Props {
  record: AttendanceRecord;
  onViewDetails: (record: AttendanceRecord) => void;
  onRequestCorrection: (record: AttendanceRecord) => void;
}

export function AttendanceActionMenu({ record, onViewDetails, onRequestCorrection }: Props) {
  const { t } = useTranslation();
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
  
  // Example simplistic check for HR Admin vs Manager vs Employee
  // Ideally, use a permissions hook like hasPermission('hrms.attendance.manage')
  const isHRAdmin = isSuperAdmin; 

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DropdownMenuItem 
          onClick={() => onViewDetails(record)}
          className="flex items-center gap-2 cursor-pointer dark:hover:bg-gray-700"
        >
          <FileText className="w-4 h-4 text-gray-500" />
          {t('auto.view_details', 'View Details')}
        </DropdownMenuItem>
        
        {!record.is_locked && (
          <>
            <DropdownMenuSeparator className="dark:bg-gray-700" />
            <DropdownMenuItem 
              onClick={() => onRequestCorrection(record)}
              className="flex items-center gap-2 cursor-pointer text-indigo-600 focus:text-indigo-700 dark:text-indigo-400 dark:hover:bg-gray-700"
            >
              <Edit className="w-4 h-4" />
              {isHRAdmin ? 'Override / Adjust' : 'Request Correction'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

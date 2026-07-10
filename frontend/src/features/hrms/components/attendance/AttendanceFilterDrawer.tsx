import { useTranslation } from 'react-i18next';
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { useDepartments, useDesignations } from '@/features/hrms/api/useOrgStructure';
import { useEmployees } from '@/features/hrms/api/useEmployees';
import { Filter, X, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { subDays, startOfWeek, startOfMonth } from 'date-fns';
import { formatIST } from '@/utils/date';

export interface AttendanceFilters {
  date_from: string;
  date_to: string;
  department_id?: string;
  designation_id?: string;
  employee_id?: string;
  shift_id?: string;
  status?: string;
  late_only?: string;
  missed_punch_only?: string;
  page?: number;
  page_size?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AttendanceFilters;
  onFilterChange: (filters: AttendanceFilters) => void;
}

export const AttendanceFilterDrawer: React.FC<Props> = ({ open, onOpenChange, filters, onFilterChange }) => {
  const { t } = useTranslation();
  const { data: rawDepartments } = useDepartments();
  const { data: rawDesignations } = useDesignations();
  const departmentsData = rawDepartments?.results || rawDepartments?.data || rawDepartments || [];
  const designationsData = rawDesignations?.results || rawDesignations?.data || rawDesignations || [];
  
  // For employees, we should probably just fetch active ones
  const { data: employeesResponse } = useEmployees({ status: 'ACTIVE', page_size: 1000 } as any);
  const employeesData = employeesResponse?.data || [];

  const applyPreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'late' | 'missed' | 'on_leave') => {
    const today = new Date();
    const newFilters = { ...filters };

    switch (preset) {
      case 'today':
        newFilters.date_from = formatIST(today, 'yyyy-MM-dd');
        newFilters.date_to = formatIST(today, 'yyyy-MM-dd');
        break;
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        newFilters.date_from = formatIST(yesterday, 'yyyy-MM-dd');
        newFilters.date_to = formatIST(yesterday, 'yyyy-MM-dd');
        break;
      }
      case 'this_week':
        newFilters.date_from = formatIST(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        newFilters.date_to = formatIST(today, 'yyyy-MM-dd');
        break;
      case 'this_month':
        newFilters.date_from = formatIST(startOfMonth(today), 'yyyy-MM-dd');
        newFilters.date_to = formatIST(today, 'yyyy-MM-dd');
        break;
      case 'late':
        newFilters.late_only = 'true';
        newFilters.missed_punch_only = '';
        newFilters.status = '';
        break;
      case 'missed':
        newFilters.missed_punch_only = 'true';
        newFilters.late_only = '';
        newFilters.status = '';
        break;
      case 'on_leave':
        newFilters.status = 'ON_LEAVE';
        newFilters.late_only = '';
        newFilters.missed_punch_only = '';
        break;
    }
    onFilterChange(newFilters);
  };

  const updateFilter = (key: keyof AttendanceFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({
      date_from: formatIST(new Date(), 'yyyy-MM-dd'),
      date_to: formatIST(new Date(), 'yyyy-MM-dd'),
    });
  };

  if (!open) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-md overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-0 flex flex-col h-full">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Filter className="w-5 h-5 text-indigo-500" />
                {t('auto.filter_attendance', 'Filter Attendance')}
              </SheetTitle>
              <SheetDescription className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                {t('auto.narrow_down_attendance_records_by_applying_specifi', 'Narrow down attendance records by applying specific criteria.')}
              </SheetDescription>
            </div>
            <button onClick={clearFilters} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500" title={t('auto.reset_filters', 'Reset Filters')}>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Quick Presets */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('auto.quick_presets', 'Quick Presets')}</label>
              <div className="flex flex-wrap gap-2">
                {['today', 'yesterday', 'this_week', 'this_month', 'late', 'missed', 'on_leave'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset as any)}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800/50"
                  >
                    {preset.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('auto.date_range', 'Date Range')}</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('auto.from', 'From')}</span>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => updateFilter('date_from', e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('auto.to', 'To')}</span>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => updateFilter('date_to', e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('auto.organization', 'Organization')}</label>
              
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.department', 'Department')}</span>
                <select
                  value={filters.department_id || ''}
                  onChange={(e) => updateFilter('department_id', e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                >
                  <option value="">{t('auto.all_departments', 'All Departments')}</option>
                  {departmentsData?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.designation', 'Designation')}</span>
                <select
                  value={filters.designation_id || ''}
                  onChange={(e) => updateFilter('designation_id', e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                >
                  <option value="">{t('auto.all_designations', 'All Designations')}</option>
                  {designationsData?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.employee', 'Employee')}</span>
                <select
                  value={filters.employee_id || ''}
                  onChange={(e) => updateFilter('employee_id', e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                >
                  <option value="">{t('auto.all_employees', 'All Employees')}</option>
                  {employeesData?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('auto.status_time', 'Status & Time')}</label>
              
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.status', 'Status')}</span>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                >
                  <option value="">{t('auto.all_statuses', 'All Statuses')}</option>
                  <option value="PRESENT">{t('auto.present', 'Present')}</option>
                  <option value="ABSENT">{t('auto.absent', 'Absent')}</option>
                  <option value="LATE">{t('auto.late', 'Late')}</option>
                  <option value="HALF_DAY">{t('auto.half_day', 'Half Day')}</option>
                  <option value="MISSED_PUNCH">{t('auto.missed_punch', 'Missed Punch')}</option>
                  <option value="ON_LEAVE">{t('auto.on_leave', 'On Leave')}</option>
                </select>
              </div>
              
              <div className="flex items-center gap-4 mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                 <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={filters.late_only === 'true'}
                      onChange={(e) => updateFilter('late_only', e.target.checked ? 'true' : '')}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    {t('auto.late_only', 'Late Only')}
                 </label>
                 <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                    <input 
                      type="checkbox" 
                      checked={filters.missed_punch_only === 'true'}
                      onChange={(e) => updateFilter('missed_punch_only', e.target.checked ? 'true' : '')}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    {t('auto.missed_punch', 'Missed Punch')}
                 </label>
              </div>

            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 sticky bottom-0 z-10 flex justify-end gap-3">
             <button 
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
             >
               {t('auto.close', 'Close')}
             </button>
             <button 
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
             >
               {t('auto.view_results', 'View Results')}
             </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

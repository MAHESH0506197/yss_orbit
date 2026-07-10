import { useState } from 'react';
import { useAttendanceList, useAttendanceStats, useExportAttendance } from '@/features/hrms/api/useAttendance';
import { AttendanceWidget } from '@/features/hrms/components/attendance/AttendanceWidget';
import { AttendanceFilterDrawer, AttendanceFilters } from '@/features/hrms/components/attendance/AttendanceFilterDrawer';
import { AttendanceActionMenu } from '@/features/hrms/components/attendance/AttendanceActionMenu';
import { AttendanceDetailsDrawer } from '@/features/hrms/components/attendance/AttendanceDetailsDrawer';
import { AttendanceCorrectionModal } from '@/features/hrms/components/attendance/AttendanceCorrectionModal';
import { AttendanceRecord } from '@/features/hrms/types/attendanceTypes';
import { Filter, Download, Loader2, Users, MapPin, Clock } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { formatIST } from '@/utils/date';

export default function AttendancePage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<AttendanceRecord | null>(null);
  const [filters, setFilters] = useState<AttendanceFilters>({
    date_from: formatIST(new Date(), 'yyyy-MM-dd'),
    date_to: formatIST(new Date(), 'yyyy-MM-dd'),
    page: 1,
    page_size: 50,
  });
  
  const { data: attendanceData, isLoading } = useAttendanceList(filters);
  const { data: stats, isLoading: isStatsLoading } = useAttendanceStats(filters);
  const { mutate: exportAttendance, isPending: isExporting } = useExportAttendance();

  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!selectedBusinessUnitId ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mb-4 rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/20">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            No Business Unit Selected
          </h3>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Please select a Business Unit from the dropdown menu in the top right header to view and manage attendance.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Attendance
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Monitor employee daily attendance, shifts, and regularization requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all relative"
          >
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
            {Object.keys(filters).length > 2 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {Object.keys(filters).length - 2}
              </span>
            )}
          </button>
          <button 
            onClick={() => exportAttendance(filters)}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 text-gray-400 animate-spin" /> : <Download className="h-4 w-4 text-gray-400" />}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AttendanceWidget />
        </div>
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Quick KPI Cards */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center">
             <p className="text-sm text-gray-500">Total</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900">{isStatsLoading ? '-' : stats?.total || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center border-b-4 border-b-green-500">
             <p className="text-sm text-gray-500">Present</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900 flex items-baseline gap-2">
               {isStatsLoading ? '-' : stats?.present || 0}
               <span className="text-xs font-medium text-green-600">{!isStatsLoading && stats?.present_percentage}%</span>
             </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center border-b-4 border-b-red-500">
             <p className="text-sm text-gray-500">Absent</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900 flex items-baseline gap-2">
               {isStatsLoading ? '-' : stats?.absent || 0}
               <span className="text-xs font-medium text-red-600">{!isStatsLoading && stats?.absent_percentage}%</span>
             </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center border-b-4 border-b-yellow-500">
             <p className="text-sm text-gray-500">Late</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900">{isStatsLoading ? '-' : stats?.late || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center border-b-4 border-b-purple-500">
             <p className="text-sm text-gray-500">On Leave</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900">{isStatsLoading ? '-' : stats?.on_leave || 0}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center border-b-4 border-b-gray-400">
             <p className="text-xs text-gray-500 truncate" title="Missed Punch/Corrections">Missed / P.C.</p>
             <p className="mt-1 text-2xl font-semibold text-gray-900 flex items-baseline gap-2">
                {isStatsLoading ? '-' : stats?.missed_punch || 0}
                <span className="text-xs font-medium text-amber-600" title="Pending Corrections">
                  {(!isStatsLoading && stats?.pending_corrections > 0) ? `+${stats?.pending_corrections}` : ''}
                </span>
             </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700 font-medium">
              Showing records for: <span className="text-indigo-600">
                {filters.date_from === filters.date_to 
                  ? formatIST(filters.date_from, 'dd MMM yyyy')
                  : `${formatIST(filters.date_from, 'dd MMM')} - ${formatIST(filters.date_to, 'dd MMM yyyy')}`}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
             Loading attendance records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Out</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData?.results?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                      No attendance records found for this date.
                    </td>
                  </tr>
                ) : (
                  attendanceData?.results?.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors hidden md:table-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                        <div className="text-sm text-gray-500">{record.employee_code} • {record.department_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.attendance_date ? formatIST(record.attendance_date, 'dd MMM yyyy') : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.shift_name || 'General Shift'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.actual_in ? formatIST(record.actual_in, 'hh:mm a') : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.actual_out ? formatIST(record.actual_out, 'hh:mm a') : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                        {parseFloat(record.work_hours).toFixed(1)}h
                        {record.late_minutes > 0 && <span className="block text-xs text-red-500 mt-0.5">{record.late_minutes}m late</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                            record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'MISSED_PUNCH' ? 'bg-orange-100 text-orange-800' :
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {record.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <AttendanceActionMenu 
                          record={record} 
                          onViewDetails={setSelectedRecordForDetails}
                          onRequestCorrection={setSelectedRecordForCorrection}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4 bg-gray-50">
              {attendanceData?.results?.map((record: any) => (
                <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{record.employee_name}</h4>
                      <p className="text-xs text-gray-500">{record.employee_code} • {record.department_name}</p>
                    </div>
                    <AttendanceActionMenu 
                      record={record} 
                      onViewDetails={setSelectedRecordForDetails}
                      onRequestCorrection={setSelectedRecordForCorrection}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/> Punches</p>
                      <p className="text-sm font-medium text-gray-900">
                        {record.actual_in ? formatIST(record.actual_in, 'HH:mm') : '--'} → {record.actual_out ? formatIST(record.actual_out, 'HH:mm') : '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Hours</p>
                      <p className="text-sm font-medium text-gray-900">{parseFloat(record.work_hours).toFixed(1)}h</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                            record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'MISSED_PUNCH' ? 'bg-orange-100 text-orange-800' :
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                      {record.status?.replace('_', ' ')}
                    </span>
                    {record.late_minutes > 0 && <span className="text-xs font-medium text-red-500">{record.late_minutes}m late</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {attendanceData?.count > 0 && (
              <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                    disabled={!attendanceData?.previous}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={!attendanceData?.next}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((filters.page || 1) - 1) * (filters.page_size || 50) + 1}</span> to <span className="font-medium">{Math.min((filters.page || 1) * (filters.page_size || 50), attendanceData?.count || 0)}</span> of <span className="font-medium">{attendanceData?.count}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                        disabled={!attendanceData?.previous}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                        disabled={!attendanceData?.next}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AttendanceFilterDrawer 
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onFilterChange={setFilters}
      />
      
      <AttendanceDetailsDrawer 
        open={!!selectedRecordForDetails}
        onOpenChange={(open) => !open && setSelectedRecordForDetails(null)}
        record={selectedRecordForDetails}
      />
      
      <AttendanceCorrectionModal 
        open={!!selectedRecordForCorrection}
        onOpenChange={(open) => !open && setSelectedRecordForCorrection(null)}
        record={selectedRecordForCorrection}
      />
        </>
      )}
    </div>
  );
}

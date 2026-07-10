import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, UserMinus, Clock, UserX, UserPlus,
  Plus, Edit2, Eye, Trash2, MoreHorizontal 
} from 'lucide-react';
import { useEmployees } from '@/features/hrms/api/useEmployees';
import { useEmployeeMutations } from '@/features/hrms/api/useEmployeeMutations';
import { Employee } from '@/features/hrms/types/employeeTypes';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';

import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { PermissionGate } from '@/components/common/PermissionGate';
import { EmployeeFormDialog } from '@/features/hrms/components/employees/EmployeeFormDialog';
import { EmployeeDetailsDrawer } from '@/features/hrms/components/employees/EmployeeDetailsDrawer';
import { EmployeeImportWizard } from '@/features/hrms/components/employees/import/EmployeeImportWizard';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatIST } from '@/utils/date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export const EmployeeListPage: React.FC = () => {
  const [filters, setFilters] = useState({});
  const { data: response, isLoading, refetch } = useEmployees(filters);
  const { deactivateEmployee, isDeactivating } = useEmployeeMutations();
  const selectedBusinessUnitId = useAuthStore(state => state.selectedBusinessUnitId);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();
  
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);

  const employees = response?.data || [];
  const meta = response?.meta;

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDrawerOpen(true);
  };

  const confirmDeactivate = (employee: Employee) => {
    setEmployeeToDeactivate(employee);
    setDeactivateModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!employeeToDeactivate) return;
    try {
      await deactivateEmployee(employeeToDeactivate.id);
      toast.success('Employee deactivated successfully');
      setDeactivateModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate employee');
    }
  };

  const columns = useMemo(() => [
    {
      id: 'employee',
      header: 'Employee',
      accessorFn: (row: Employee) => `${row.first_name} ${row.last_name}`,
      cell: (info: any) => {
        const emp = info.row.original as Employee;
        const initial = emp.first_name ? emp.first_name.charAt(0).toUpperCase() : 'E';

        return (
          <div className="flex items-center gap-3">
            {emp.photo_url ? (
              <img src={emp.photo_url} alt={`${emp.first_name} photo`} className="h-10 w-10 shrink-0 rounded-full object-cover border border-gray-200 bg-white dark:border-gray-700" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-indigo-900">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <span className="block truncate font-bold text-gray-900 transition-colors hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 cursor-pointer" onClick={() => handleView(emp)}>
                {emp.first_name} {emp.last_name}
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                {emp.work_email || emp.personal_email || 'No email provided'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'employee_code',
      header: 'Code',
      cell: (info: any) => (
        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20 font-mono">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: (info: any) => {
        const emp = info.row.original as Employee;
        return <span className="text-sm">{emp.department_name || '-'}</span>;
      },
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: (info: any) => {
        const emp = info.row.original as Employee;
        return <span className="text-sm">{emp.designation_name || '-'}</span>;
      },
    },
    {
      accessorKey: 'employment_status',
      header: 'Status',
      cell: (info: any) => {
        const status = info.getValue() as string;
        let colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        if (status === 'ACTIVE') colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400';
        if (status === 'ON_LEAVE') colorClass = 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400';
        if (status === 'TERMINATED' || status === 'RESIGNED') colorClass = 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400';
        
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colorClass}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'date_of_joining',
      header: 'Joining Date',
      cell: (info: any) => {
        const val = info.getValue();
        return <span className="text-sm text-gray-600 dark:text-gray-400">{val ? formatIST(val, 'MMM d, yyyy') : '-'}</span>;
      },
    },
    // Future-ready columns (can be hidden later)
    {
      accessorKey: 'reporting_manager_id',
      header: 'Manager',
      cell: (info: any) => <span className="text-sm text-gray-500">{info.getValue() || '-'}</span>,
    },
    {
      accessorKey: 'business_unit_id',
      header: 'Business Unit',
      cell: (info: any) => <span className="text-sm text-gray-500 hidden lg:table-cell">{info.getValue() || '-'}</span>,
    },
    {
      accessorKey: 'user_id',
      header: 'Linked User',
      cell: (info: any) => (
        <span className="text-sm text-gray-500">
          {info.getValue() ? <UserCheck className="h-4 w-4 text-emerald-500" /> : '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: (info: any) => {
        const emp = info.row.original as Employee;
        return (
          <div className="flex items-center justify-end gap-2 transition-opacity">
            <button
              onClick={() => handleView(emp)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="View Profile"
            >
              <Eye className="h-4 w-4" />
            </button>
            <PermissionGate permission="hrms.employees.edit">
              <button
                onClick={() => handleEdit(emp)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                title="Edit Employee"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => confirmDeactivate(emp)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                title="Deactivate / Terminate"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </PermissionGate>
          </div>
        );
      },
    },
  ], []);

  const renderFilters = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <select 
          className="h-10 appearance-none rounded-xl border border-gray-200 bg-white/50 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-900"
          onChange={(e) => setFilters(prev => ({ ...prev, employment_status: e.target.value }))}
          defaultValue=""
        >
          <option value="">Status: All</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="NOTICE_PERIOD">Notice Period</option>
          <option value="TERMINATED">Terminated</option>
          <option value="RESIGNED">Resigned</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>
      
      <div className="relative">
        <select 
          className="h-10 appearance-none rounded-xl border border-gray-200 bg-white/50 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:bg-gray-900"
          onChange={(e) => setFilters(prev => ({ ...prev, employment_type: e.target.value }))}
          defaultValue=""
        >
          <option value="">Type: All</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERN">Intern</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {!selectedBusinessUnitId ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mb-4 rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/20">
            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            No Business Unit Selected
          </h3>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Please select a Business Unit from the dropdown menu in the top right header to view and manage employees.
          </p>
        </div>
      ) : (
        <>
          {/* Header & Stats */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Employees
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            Manage employee records, employment information, and compliance details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="hrms.employees.create">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all">
                  <Plus className="h-4 w-4" />
                  Add Employee
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => {
                  setSelectedEmployee(null);
                  setIsFormOpen(true);
                }}>
                  Add Employee
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportWizardOpen(true)}>
                  Import Employees
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/hrms/employees/import-history')}>
                  View Import History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Employees"
          value={meta?.total || 0}
          icon={Users}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
        />
        <StatCard
          label="Active"
          value={meta?.active || 0}
          icon={UserCheck}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard
          label="Inactive"
          value={meta?.inactive || 0}
          icon={UserX}
          gradient="bg-gradient-to-br from-rose-400 to-rose-600"
        />
        <StatCard
          label="On Probation"
          value={meta?.on_probation || 0}
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-400 to-amber-600"
        />
        <StatCard
          label="Resigned"
          value={meta?.resigned || 0}
          icon={UserMinus}
          gradient="bg-gradient-to-br from-orange-400 to-orange-600"
        />
        <StatCard
          label="New Joiners"
          value={meta?.new_joiners || 0}
          icon={UserPlus}
          gradient="bg-gradient-to-br from-blue-400 to-blue-600"
        />
      </div>

      <DataTable
        columns={columns}
        data={employees}
        searchKey="employee"
        filters={renderFilters()}
        isLoading={isLoading}
          />

          {/* Deactivate Confirmation Modal */}
          <Modal 
          isOpen={deactivateModalOpen} 
          onClose={() => setDeactivateModalOpen(false)}
          title="Deactivate Employee"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to deactivate <span className="font-semibold text-gray-900 dark:text-white">{employeeToDeactivate?.first_name} {employeeToDeactivate?.last_name}</span>? 
              They will no longer be able to log in and their status will be set to inactive. This action is auditable.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setDeactivateModalOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isDeactivating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Confirm Deactivation
              </button>
            </div>
          </div>
        </Modal>
        </>
      )}

      {/* Employee Details & Forms */}
      <EmployeeFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        employee={selectedEmployee} 
      />
      <EmployeeDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        employeeId={selectedEmployee?.id} 
      />
      <EmployeeImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
      />
    </div>
  );
};

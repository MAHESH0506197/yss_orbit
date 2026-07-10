// yss_orbit\frontend\src\pages\hrms\HRMSPortalPage.tsx
import React, { useEffect, useState } from 'react';
import { useHrmsStore } from '@/store/useHrmsStore';
import { usePagination } from '@/utils/shared/hooks/usePagination';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const HRMSPortal: React.FC = () => {
  const { employees, isLoading, error, fetchEmployees, addEmployee } = useHrmsStore();
  const { page, setPage, limit } = usePagination(1, 10);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', department: '', position: '', status: 'active' as const });

  useEffect(() => {
    fetchEmployees(page, limit);
  }, [page, limit, fetchEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEmployee(formData);
      setShowAdd(false);
      setFormData({ firstName: '', lastName: '', department: '', position: '', status: 'active' });
    } catch (err) {
      alert('Failed to add employee');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HRMS Portal</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showAdd ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 bg-red-50 p-3 rounded">{error}</div>}

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              placeholder="First Name" className="border p-2 rounded" required
              value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} 
            />
            <input 
              placeholder="Last Name" className="border p-2 rounded" required
              value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} 
            />
            <input 
              placeholder="Department" className="border p-2 rounded" required
              value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} 
            />
            <input 
              placeholder="Position" className="border p-2 rounded" required
              value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} 
            />
          </div>
          <button type="submit" disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded self-end disabled:opacity-50">
            Save Employee
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Department</th>
              <th className="p-4">Position</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && employees.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">Loading employees...</td></tr>
            ) : employees.map((emp: any) => (
              <tr key={emp.id} className="border-t">
                <td className="p-4">{emp.firstName} {emp.lastName}</td>
                <td className="p-4">{emp.department}</td>
                <td className="p-4">{emp.position}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    emp.status === 'active' ? 'bg-green-100 text-green-800' :
                    emp.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && employees.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No employees found</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage((p: any) => p - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button 
            onClick={() => setPage((p: any) => p + 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default function HRMSPortalPage() {
  return (
    <ErrorBoundary>
      <HRMSPortal />
    </ErrorBoundary>
  );
}

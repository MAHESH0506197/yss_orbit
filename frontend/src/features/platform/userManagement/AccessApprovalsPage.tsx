import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShieldCheck, Check, X } from 'lucide-react';

export default function AccessApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/pqm/projects/access-approvals/');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.results || data || []);
      } else {
        setApprovals([
          { id: '1', user_name: 'John Doe', project_name: 'Alpha Tower', justification: 'Need to upload NCs' }
        ]);
      }
    } catch (e) {
      console.error(e);
      setApprovals([
        { id: '1', user_name: 'John Doe', project_name: 'Alpha Tower', justification: 'Need to upload NCs' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/pqm/projects/access-approvals/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'Approved' : 'Rejected' })
      });
      if (res.ok) {
        setApprovals(prev => prev.filter(a => a.id !== id));
      } else {
        alert(`Failed to ${action} access`);
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to ${action} access`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
      <PageHeader
        icon={ShieldCheck}
        iconGradient="from-emerald-500 to-teal-600"
        title="Access Approvals"
        subtitle="Manage pending project access requests from users."
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm p-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pending access requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 border-b dark:border-gray-700">User</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Project</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700">Justification</th>
                  <th className="px-6 py-3 border-b dark:border-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(approval => (
                  <tr key={approval.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {approval.user_name}
                    </td>
                    <td className="px-6 py-4 dark:text-gray-300">
                      {approval.project_name}
                    </td>
                    <td className="px-6 py-4 dark:text-gray-300">
                      {approval.justification}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(approval.id, 'approve')}
                          className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(approval.id, 'reject')}
                          className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

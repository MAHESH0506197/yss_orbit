import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LeaveDashboard } from '@/features/hrms/components/leave/LeaveDashboard';
import { TeamLeaveDashboard } from '@/features/hrms/components/leave/TeamLeaveDashboard';
import { LeaveSettingsDashboard } from '@/features/hrms/components/leave/LeaveSettingsDashboard';
import { LeaveReportsDashboard } from '@/features/hrms/components/leave/LeaveReportsDashboard';

export default function LeavePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'my_leave' | 'team_leave' | 'settings' | 'reports'>('my_leave');

  const handleTabChange = (tab: 'my_leave' | 'team_leave' | 'settings' | 'reports') => {
    setActiveTab(tab);
    if (tab === 'my_leave') navigate('/hrms/leave');
    if (tab === 'team_leave') navigate('/hrms/leave/team');
    if (tab === 'settings') navigate('/hrms/leave/settings');
    if (tab === 'reports') navigate('/hrms/leave/reports');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => handleTabChange('my_leave')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my_leave' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          My Leave
        </button>
        <button 
          onClick={() => handleTabChange('team_leave')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'team_leave' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Team Leave
        </button>
        <button 
          onClick={() => handleTabChange('settings')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Settings
        </button>
        <button 
          onClick={() => handleTabChange('reports')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reports' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Reports
        </button>
      </div>

      <Routes>
        <Route path="/" element={<LeaveDashboard />} />
        <Route path="/team" element={<TeamLeaveDashboard />} />
        <Route path="/settings" element={<LeaveSettingsDashboard />} />
        <Route path="/reports" element={<LeaveReportsDashboard />} />
      </Routes>
    </div>
  );
}

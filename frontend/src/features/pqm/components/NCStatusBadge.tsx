// yss_orbit\frontend\src\features\pqm\components\NCStatusBadge.tsx
import React from 'react';
import {
  FileText,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  PlayCircle,
  Wrench,
  Clock,
  CheckSquare,
  RotateCcw,
  Lock,
  RefreshCcw,
  Merge,
} from 'lucide-react';
import { NCStatus } from '../types';

interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<NCStatus, StatusConfig> = {
  Draft:                  { color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', icon: <FileText size={11} />, label: 'Draft' },
  Submitted:              { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: <Send size={11} />, label: 'Submitted' },
  'Under Review':         { color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD', icon: <Eye size={11} />, label: 'Under Review' },
  Approved:               { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle size={11} />, label: 'Approved' },
  Rejected:               { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: <XCircle size={11} />, label: 'Rejected' },
  Assigned:               { color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: <UserCheck size={11} />, label: 'Assigned' },
  'In Progress':          { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: <PlayCircle size={11} />, label: 'In Progress' },
  Rectified:              { color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD', icon: <Wrench size={11} />, label: 'Rectified' },
  'Verification Pending': { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: <Clock size={11} />, label: 'Verification Pending' },
  'Approved for Closure': { color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', icon: <CheckSquare size={11} />, label: 'Approved for Closure' },
  Rework:                 { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: <RotateCcw size={11} />, label: 'Rework' },
  Closed:                 { color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: <Lock size={11} />, label: 'Closed' },
  Reopened:               { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: <RefreshCcw size={11} />, label: 'Reopened' },
  Merged:                 { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: <Merge size={11} />, label: 'Merged' },
};

interface NCStatusBadgeProps {
  status: NCStatus;
  size?: 'sm' | 'md';
}

export function NCStatusBadge({ status, size = 'md' }: NCStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Draft'];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        borderRadius: '999px',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
      role="status"
      aria-label={`Status: ${cfg.label}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

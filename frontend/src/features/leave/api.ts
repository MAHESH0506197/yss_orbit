// yss_orbit\frontend\src\features\leave\api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaveRequest, LeaveFormData, LeaveStatus } from './types';

// Mock Data
let mockLeaves: LeaveRequest[] = [
  {
    id: '1',
    employeeId: 'emp1',
    employeeName: 'Alice Johnson',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    type: 'annual',
    status: 'pending',
    reason: 'Family vacation',
    appliedAt: '2026-05-28T10:00:00Z',
  },
  {
    id: '2',
    employeeId: 'emp2',
    employeeName: 'Bob Smith',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    type: 'sick',
    status: 'approved',
    reason: 'Flu',
    appliedAt: '2026-05-09T08:30:00Z',
  },
  {
    id: '3',
    employeeId: 'emp3',
    employeeName: 'Charlie Brown',
    startDate: '2026-04-15',
    endDate: '2026-04-15',
    type: 'unpaid',
    status: 'rejected',
    reason: 'Personal errands',
    appliedAt: '2026-04-10T14:20:00Z',
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useLeaves = (status?: LeaveStatus) => {
  return useQuery({
    queryKey: ['leaves', status],
    queryFn: async () => {
      await delay(800); // Simulate network delay
      if (status) {
        return mockLeaves.filter((l) => l.status === status);
      }
      return mockLeaves;
    },
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LeaveFormData) => {
      await delay(1000);
      const newLeave: LeaveRequest = {
        id: Math.random().toString(36).substring(2, 9),
        employeeId: 'currentUser',
        employeeName: 'Current User',
        status: 'pending',
        appliedAt: new Date().toISOString(),
        ...data,
      };
      mockLeaves = [newLeave, ...mockLeaves];
      return newLeave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      await delay(500);
      mockLeaves = mockLeaves.map((l) => (l.id === id ? { ...l, status } : l));
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};

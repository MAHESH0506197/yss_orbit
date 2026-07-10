import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import toast from 'react-hot-toast';

export interface SessionDto {
  id: string;
  device_info: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active_at: string;
  expires_at: string;
  is_current: boolean;
}

export const useSessions = () => {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery<SessionDto[]>({
    queryKey: ['profile', 'sessions'],
    queryFn: async () => {
      const res = await api.get('/profile/me/sessions/');
      // Handle paginated responses or wrapped success responses
      if (res.data && Array.isArray(res.data.results)) {
        return res.data.results;
      }
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.delete(`/profile/me/sessions/${sessionId}/revoke/`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Session signed out successfully');
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to sign out session');
    }
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    isError: sessionsQuery.isError,
    revokeSession: revokeMutation.mutate,
    isRevoking: revokeMutation.isPending
  };
};

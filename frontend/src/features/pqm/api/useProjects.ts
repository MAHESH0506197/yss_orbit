import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pqmService } from './pqmService';
import type { PQMProject } from '../types';

export function useProjects(params?: Record<string, any>) {
  return useQuery<{ results: PQMProject[], meta: any }>({
    queryKey: ['pqm-projects', params],
    queryFn: () => pqmService.listProjects(params),
    placeholderData: keepPreviousData,
  });
}

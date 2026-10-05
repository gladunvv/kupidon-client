import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { Goal } from '@/types/reference';

export function getGoals(): Promise<Goal[]> {
  return apiRequest<Goal[]>('/reference/goals');
}

export function useGoals() {
  return useQuery({
    queryKey: ['reference', 'goals'],
    queryFn: getGoals,
    staleTime: Infinity,
  });
}

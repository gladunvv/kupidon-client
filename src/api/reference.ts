import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { City, Goal, Interest, LifestyleOption } from '@/types/reference';

// Dictionaries don't change within a session.
const forever = { staleTime: Infinity } as const;

export function useGoals() {
  return useQuery({
    queryKey: ['reference', 'goals'],
    queryFn: () => apiRequest<Goal[]>('/reference/goals'),
    ...forever,
  });
}

export function useInterests() {
  return useQuery({
    queryKey: ['reference', 'interests'],
    queryFn: () => apiRequest<Interest[]>('/reference/interests'),
    ...forever,
  });
}

export function useLifestyleOptions() {
  return useQuery({
    queryKey: ['reference', 'lifestyle-options'],
    queryFn: () =>
      apiRequest<LifestyleOption[]>('/reference/lifestyle-options'),
    ...forever,
  });
}

export function useCities(search: string) {
  const term = search.trim();
  return useQuery({
    queryKey: ['reference', 'cities', term],
    queryFn: () =>
      apiRequest<City[]>(
        term
          ? `/reference/cities?${new URLSearchParams({ search: term, limit: '10' })}`
          : '/reference/cities/popular?limit=10',
      ),
    placeholderData: keepPreviousData,
    ...forever,
  });
}

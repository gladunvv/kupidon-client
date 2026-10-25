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

// Candidates carry `city` as a bare id and the api has no lookup by id, so
// names come from one full list (capped at 100 by the api — enough for the
// seeded dictionary; a by-id endpoint is needed once it grows past that).
export function useCityNames() {
  return useQuery({
    queryKey: ['reference', 'cities', 'all'],
    queryFn: () => apiRequest<City[]>('/reference/cities?limit=100'),
    select: (cities) =>
      new Map(cities.map((city) => [city._id, city.name] as const)),
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

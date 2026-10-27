import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequestPage } from '@/api/client';

// Shape of GET /match items (match.service.ts getUserMatches): partner is
// absent when that account was deleted, dialog when it was never created.
export interface MatchItem {
  _id: string;
  created_at: string;
  partner?: {
    _id: string;
    name?: string;
    age?: number;
    photos?: string[];
    about?: string;
  };
  dialog?: { _id: string; hasLastMessage: boolean };
}

export const matchesKey = ['matches'] as const;

export function useMatches() {
  return useInfiniteQuery({
    queryKey: matchesKey,
    queryFn: ({ pageParam }) =>
      apiRequestPage<MatchItem>(
        `/match?${new URLSearchParams({ page: String(pageParam), limit: '20' })}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
  });
}

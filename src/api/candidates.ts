import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequestPage } from '@/api/client';
import type { Candidate } from '@/types/candidate';

const PAGE_SIZE = 10;

export function useCandidates() {
  return useInfiniteQuery({
    queryKey: ['candidates'],
    queryFn: ({ pageParam }) =>
      apiRequestPage<Candidate>(
        `/users/list?${new URLSearchParams({ page: String(pageParam), limit: String(PAGE_SIZE) })}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
  });
}

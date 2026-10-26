import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { apiRequestPage, type Page } from '@/api/client';
import type { Candidate } from '@/types/candidate';

const PAGE_SIZE = 10;
export const candidatesKey = ['candidates'] as const;
// Outside the ['candidates'] prefix: invalidate/reset of the feed must not wipe it.
const passedKey = ['feed-passed'] as const;

export function useCandidates() {
  return useInfiniteQuery({
    queryKey: candidatesKey,
    queryFn: ({ pageParam }) =>
      apiRequestPage<Candidate>(
        `/users/list?${new URLSearchParams({ page: String(pageParam), limit: String(PAGE_SIZE) })}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
  });
}

export function removeCandidate(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<InfiniteData<Page<Candidate>>>(
    candidatesKey,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          items: page.items.filter((candidate) => candidate._id !== id),
          pagination: {
            ...page.pagination,
            total: Math.max(0, page.pagination.total - 1),
          },
        })),
      },
  );
}

// The api has no "pass": a skipped profile is hidden only on this client and
// returns after a reload. Kept in the query cache so sign-out clears it.
export function usePassedIds() {
  return useQuery({
    queryKey: passedKey,
    queryFn: () => [] as string[],
    initialData: [] as string[],
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function passCandidate(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<string[]>(passedKey, (ids = []) =>
    ids.includes(id) ? ids : [...ids, id],
  );
}

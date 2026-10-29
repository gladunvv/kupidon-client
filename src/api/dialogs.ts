import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequestPage } from '@/api/client';

export interface LastMessage {
  _id: string;
  text: string;
  sender: { _id: string; name?: string };
  created_at: string;
}

// Shape of GET /dialogs items (dialog.service.ts getUserDialogs). Note
// `partner.photos` is the first photo as a single string, not an array; a
// dialog exists from the moment of the match, so `lastMessage` may be null.
export interface DialogItem {
  _id: string;
  matchId: string;
  partner?: { _id: string; name?: string; photos?: string };
  lastMessage: LastMessage | null;
  updated_at: string;
  isActive: boolean;
}

export const dialogsKey = ['dialogs'] as const;

export function useDialogs() {
  return useInfiniteQuery({
    queryKey: dialogsKey,
    queryFn: ({ pageParam }) =>
      apiRequestPage<DialogItem>(
        `/dialogs?${new URLSearchParams({ page: String(pageParam), limit: '20' })}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.page + 1 : undefined,
  });
}

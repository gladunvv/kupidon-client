import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesKey, removeCandidate } from '@/api/candidates';
import { apiRequest } from '@/api/client';
import { matchesKey } from '@/api/matches';
import type { Candidate } from '@/types/candidate';

export type LikeResult =
  | { matched: false }
  | { matched: true; match: { _id: string }; dialog: { _id: string } };

export function useLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidate: Candidate) =>
      apiRequest<LikeResult>('/match/like', {
        method: 'POST',
        body: JSON.stringify({ likedUserId: candidate._id }),
      }),
    // Hidden right away; the api excludes liked users from /users/list, so a
    // refetch would drop the card anyway. On failure the snapshot is put back
    // explicitly — with the api down a refetch would fail too.
    onMutate: (candidate) => {
      const previous = queryClient.getQueryData(candidatesKey);
      removeCandidate(queryClient, candidate._id);
      return { previous };
    },
    onSuccess: (result) => {
      if (result.matched) {
        void queryClient.invalidateQueries({ queryKey: matchesKey });
      }
    },
    onError: (_error, _candidate, context) => {
      if (context?.previous) {
        queryClient.setQueryData(candidatesKey, context.previous);
      }
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiUpload } from '@/api/client';
import type { Profile } from '@/types/user';

const profileKey = ['profile'] as const;
// Cache is patched from the response and the refetch is fired, not awaited:
// a returned promise would hold the mutation pending through the refetch's
// retries (seconds when the api is down, indefinitely in a background tab)
// and delay the error and rollback.
function patchPhotos(
  queryClient: ReturnType<typeof useQueryClient>,
  change: (photos: string[]) => string[],
) {
  queryClient.setQueryData<Profile>(profileKey, (current) =>
    current ? { ...current, photos: change(current.photos) } : current,
  );
  void queryClient.invalidateQueries({ queryKey: profileKey });
}

// Photo writes run one at a time: a later reorder must not race an earlier
// one (the slower response would win and restore a stale order), and a
// reorder must not race a delete (count mismatch on the server).
const photosScope = { id: 'photos' };

export function useUploadPhotos(onProgress: (fraction: number) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    scope: photosScope,
    mutationFn: (files: File[]) => {
      const body = new FormData();
      for (const file of files) body.append('photos', file);
      return apiUpload<{ photos: string[] }>(
        '/upload/photos',
        body,
        onProgress,
      );
    },
    // The api appends new photos to the end and returns only their URLs.
    onSuccess: ({ photos }) =>
      patchPhotos(queryClient, (current) => [...current, ...photos]),
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    scope: photosScope,
    mutationFn: (photoPath: string) =>
      apiRequest<null>('/upload/photo', {
        method: 'DELETE',
        body: JSON.stringify({ photoPath }),
      }),
    onSuccess: (_data, photoPath) =>
      patchPhotos(queryClient, (current) =>
        current.filter((photo) => photo !== photoPath),
      ),
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: profileKey });
    },
  });
}

const reorderKey = ['photos', 'reorder'] as const;

export function useReorderPhotos() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: reorderKey,
    scope: photosScope,
    mutationFn: (photoOrder: string[]) =>
      apiRequest<{ photos: string[] }>('/upload/photos/reorder', {
        method: 'PUT',
        body: JSON.stringify({ photoOrder }),
      }),
    // Refetch only after the last queued reorder: an earlier response would
    // otherwise overwrite a newer optimistic order.
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: reorderKey }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: profileKey });
      }
    },
  });

  // Applied to the cache synchronously, before the request: the next tap
  // then builds on this order even if it lands before any request starts.
  function reorder(change: (photos: string[]) => string[]) {
    const profile = queryClient.getQueryData<Profile>(profileKey);
    if (!profile) return;
    const next = change(profile.photos);
    if (next.join('\n') === profile.photos.join('\n')) return;
    void queryClient.cancelQueries({ queryKey: profileKey });
    queryClient.setQueryData<Profile>(profileKey, { ...profile, photos: next });
    // Explicit rollback: if the api is down the follow-up refetch fails too,
    // and the optimistic order would otherwise stay on screen.
    mutation.mutate(next, {
      onError: () =>
        queryClient.setQueryData<Profile>(profileKey, (current) =>
          current ? { ...current, photos: profile.photos } : current,
        ),
    });
  }

  return { ...mutation, reorder };
}

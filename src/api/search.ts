import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { SearchPreferencesPayload } from '@/feed/search-form';
import type { Profile } from '@/types/user';

function useRefreshFeed() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    // Reset, not invalidate: already loaded pages belong to the old filter.
    void queryClient.resetQueries({ queryKey: ['candidates'] });
  };
}

// The response is the raw user (references not populated), so it isn't put
// into the profile cache — the profile is refetched instead.
export function useUpdateSearchPreferences() {
  const refreshFeed = useRefreshFeed();
  return useMutation({
    mutationFn: (payload: SearchPreferencesPayload) =>
      apiRequest<unknown>('/users/search-preferences', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: refreshFeed,
  });
}

export function useUpdateLocation() {
  const refreshFeed = useRefreshFeed();
  return useMutation({
    mutationFn: (coordinates: [longitude: number, latitude: number]) =>
      apiRequest<Profile>('/users', {
        method: 'PUT',
        body: JSON.stringify({ coordinates }),
      }),
    onSuccess: refreshFeed,
  });
}

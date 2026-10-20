import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { Profile, UpdateProfilePayload } from '@/types/user';

const profileKey = ['profile'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: () => apiRequest<Profile>('/users'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiRequest<Profile>('/users', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: (profile) => queryClient.setQueryData(profileKey, profile),
  });
}

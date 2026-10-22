import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUpload } from '@/api/client';

export function useUploadPhotos(onProgress: (fraction: number) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const body = new FormData();
      for (const file of files) body.append('photos', file);
      return apiUpload<{ photos: string[] }>(
        '/upload/photos',
        body,
        onProgress,
      );
    },
    // The response lists only the new URLs, so the full order comes from the
    // profile itself.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

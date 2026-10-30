import { useQuery, type QueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';

export interface ChatMessage {
  _id: string;
  text: string;
  sender: { _id: string; name?: string };
  created_at: string;
}

interface MessagesPage {
  messages: ChatMessage[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

export interface DialogDetails {
  _id: string;
  partner?: {
    _id: string;
    name?: string;
    age?: number;
    photos?: string[];
    about?: string;
  };
}

export const messagesKey = (dialogId: string) =>
  ['messages', dialogId] as const;

export function useDialogDetails(dialogId: string) {
  return useQuery({
    queryKey: ['dialog', dialogId],
    queryFn: () => apiRequest<DialogDetails>(`/dialogs/${dialogId}`),
  });
}

// Latest page only; older history arrives with cursor paging (CHAT-05).
// Messages within a page come oldest → newest.
export function useMessages(dialogId: string) {
  return useQuery({
    queryKey: messagesKey(dialogId),
    queryFn: () =>
      apiRequest<MessagesPage>(`/dialogs/${dialogId}/messages?limit=30`),
  });
}

// The same message can arrive from both history and the socket broadcast.
export function appendMessage(
  queryClient: QueryClient,
  dialogId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<MessagesPage>(messagesKey(dialogId), (page) =>
    !page || page.messages.some((m) => m._id === message._id)
      ? page
      : { ...page, messages: [...page.messages, message] },
  );
}

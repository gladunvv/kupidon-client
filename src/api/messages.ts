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

// Deduped by id and ordered by it: ObjectIds grow with creation time, so this
// is the server's order regardless of how messages reached the client.
export function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map(existing.map((m) => [m._id, m]));
  for (const message of incoming) byId.set(message._id, message);
  return [...byId.values()].sort((a, b) => (a._id < b._id ? -1 : 1));
}

const MAX_RESYNC_PAGES = 5;

// The api doesn't replay what a socket missed while disconnected (by design,
// see its README), so after every join the latest messages are fetched and
// merged. If the gap is longer than a page, older pages are fetched until a
// known message shows up, so no hole is left in the middle of the thread.
export async function resyncMessages(
  queryClient: QueryClient,
  dialogId: string,
): Promise<ChatMessage[]> {
  const cached = queryClient.getQueryData<MessagesPage>(messagesKey(dialogId));
  const known = new Set(cached?.messages.map((m) => m._id));
  const fetched: ChatMessage[] = [];
  let page = await apiRequest<MessagesPage>(
    `/dialogs/${dialogId}/messages?limit=30`,
  );
  const latestPagination = page.pagination;
  fetched.push(...page.messages);
  for (
    let i = 1;
    cached &&
    known.size > 0 &&
    i < MAX_RESYNC_PAGES &&
    page.pagination.hasMore &&
    page.pagination.nextCursor &&
    !page.messages.some((m) => known.has(m._id));
    i++
  ) {
    page = await apiRequest<MessagesPage>(
      `/dialogs/${dialogId}/messages?limit=30&before=${page.pagination.nextCursor}`,
    );
    fetched.push(...page.messages);
  }
  queryClient.setQueryData<MessagesPage>(messagesKey(dialogId), (current) =>
    current
      ? { ...current, messages: mergeMessages(current.messages, fetched) }
      : { messages: mergeMessages([], fetched), pagination: latestPagination },
  );
  return fetched;
}

// The same message can arrive from both history and the socket broadcast.
export function appendMessage(
  queryClient: QueryClient,
  dialogId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<MessagesPage>(
    messagesKey(dialogId),
    (page) =>
      page && { ...page, messages: mergeMessages(page.messages, [message]) },
  );
}

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
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

// Messages within a page come oldest → newest.
export function useMessages(dialogId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: messagesKey(dialogId),
    queryFn: async ({ signal }) => {
      const page = await fetchRecentMessages(queryClient, dialogId, signal);
      // Read after fetching: pagination or socket events may have added rows.
      return mergeHistory(
        queryClient.getQueryData<MessagesPage>(messagesKey(dialogId)),
        page,
      );
    },
  });
}

export function useOlderMessages(dialogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['older-messages', dialogId],
    mutationFn: (before: string) =>
      apiRequest<MessagesPage>(
        `/dialogs/${dialogId}/messages?limit=30&before=${encodeURIComponent(before)}`,
      ),
    onSuccess: (page, before) => {
      queryClient.setQueryData<MessagesPage>(
        messagesKey(dialogId),
        (current) => {
          // Ignore stale responses after logout or another page advancing the cursor.
          if (!current || current.pagination.nextCursor !== before)
            return current;
          return {
            messages: mergeMessages(current.messages, page.messages),
            pagination: page.pagination,
          };
        },
      );
    },
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

function mergeHistory(
  current: MessagesPage | undefined,
  page: MessagesPage,
): MessagesPage {
  if (!current) return page;
  return {
    messages: mergeMessages(current.messages, page.messages),
    pagination:
      current.messages.length &&
      (!page.messages.length || current.messages[0]._id < page.messages[0]._id)
        ? current.pagination
        : page.pagination,
  };
}

// The api doesn't replay what a socket missed while disconnected (by design,
// see its README), so after every join the latest messages are fetched and
// merged. If the gap is longer than a page, older pages are fetched until a
// known message shows up, so no hole is left in the middle of the thread.
async function fetchRecentMessages(
  queryClient: QueryClient,
  dialogId: string,
  signal?: AbortSignal,
): Promise<MessagesPage> {
  const cached = queryClient.getQueryData<MessagesPage>(messagesKey(dialogId));
  const known = new Set(cached?.messages.map((m) => m._id));
  const fetched: ChatMessage[] = [];
  let page = await apiRequest<MessagesPage>(
    `/dialogs/${dialogId}/messages?limit=30`,
    { signal },
  );
  fetched.push(...page.messages);
  while (
    cached &&
    known.size > 0 &&
    page.pagination.hasMore &&
    page.pagination.nextCursor &&
    !page.messages.some((m) => known.has(m._id))
  ) {
    page = await apiRequest<MessagesPage>(
      `/dialogs/${dialogId}/messages?limit=30&before=${page.pagination.nextCursor}`,
      { signal },
    );
    fetched.push(...page.messages);
  }
  return { messages: mergeMessages([], fetched), pagination: page.pagination };
}

export async function resyncMessages(
  queryClient: QueryClient,
  dialogId: string,
): Promise<ChatMessage[]> {
  const query = queryClient
    .getQueryCache()
    .find({ queryKey: messagesKey(dialogId), exact: true });
  const page = await fetchRecentMessages(queryClient, dialogId);
  // The initial history request can still be in flight. Seed its cache so
  // messages fetched after joining aren't lost; a cleared query stays cleared.
  if (
    !query ||
    queryClient
      .getQueryCache()
      .find({ queryKey: messagesKey(dialogId), exact: true }) !== query
  )
    return page.messages;
  queryClient.setQueryData<MessagesPage>(messagesKey(dialogId), (current) => {
    return mergeHistory(current, page);
  });
  return page.messages;
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

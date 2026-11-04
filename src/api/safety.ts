import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { candidatesKey, passCandidate } from '@/api/candidates';
import { apiRequest, type Page } from '@/api/client';
import { dialogsKey, type DialogItem } from '@/api/dialogs';
import { matchesKey, type MatchItem } from '@/api/matches';
import { messagesKey, type DialogDetails } from '@/api/messages';

export type ReportReason =
  'spam' | 'inappropriate_content' | 'harassment' | 'fake_profile' | 'other';

export interface ReportPayload {
  reason: ReportReason;
  details?: string;
}

export async function blockUser(userId: string): Promise<void> {
  await apiRequest(`/users/${userId}/block`, { method: 'POST' });
}

export async function reportUser(
  userId: string,
  payload: ReportPayload,
): Promise<void> {
  await apiRequest(`/users/${userId}/report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function clearBlockedUser(
  queryClient: QueryClient,
  userId: string,
  dialogId?: string,
): Promise<void> {
  const dialogIds = new Set(dialogId ? [dialogId] : []);
  const dialogs =
    queryClient.getQueryData<InfiniteData<Page<DialogItem>>>(dialogsKey);
  const matches =
    queryClient.getQueryData<InfiniteData<Page<MatchItem>>>(matchesKey);
  for (const page of dialogs?.pages ?? []) {
    for (const dialog of page.items) {
      if (dialog.partner?._id === userId) dialogIds.add(dialog._id);
    }
  }
  for (const page of matches?.pages ?? []) {
    for (const match of page.items) {
      if (match.partner?._id === userId && match.dialog)
        dialogIds.add(match.dialog._id);
    }
  }
  for (const [key, details] of queryClient.getQueriesData<DialogDetails>({
    queryKey: ['dialog'],
  })) {
    if (details?.partner?._id === userId) dialogIds.add(String(key[1]));
  }

  // A pending like can roll back an older feed snapshot. Keep the hidden id
  // outside the feed cache, just as a skipped candidate is tracked there.
  passCandidate(queryClient, userId);
  const listKeys = [candidatesKey, dialogsKey, matchesKey];
  await Promise.all([
    ...listKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
    ...[...dialogIds].flatMap((id) => [
      queryClient.cancelQueries({ queryKey: ['dialog', id] }),
      queryClient.cancelQueries({ queryKey: messagesKey(id) }),
    ]),
  ]);
  for (const id of dialogIds) {
    queryClient.removeQueries({ queryKey: ['dialog', id], exact: true });
    queryClient.removeQueries({ queryKey: messagesKey(id), exact: true });
  }
  // Blocking shifts offset pages. Start lists from page one instead of
  // keeping old pages whose boundaries no longer match the server.
  for (const queryKey of listKeys) void queryClient.resetQueries({ queryKey });
}

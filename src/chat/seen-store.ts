import type { LastMessage } from '@/api/dialogs';

// The api tracks no read state, so "new" is derived on this device: the last
// message came from the partner and this dialog hasn't been opened since.
// Per-device by nature; keyed by user id so accounts sharing a browser don't
// mix. Storage can be unavailable (private mode) — then nothing counts as
// seen, which errs toward showing the badge.
type SeenMap = Record<string, string>;

const storageKey = (userId: string) => `kupidon:seen:${userId}`;

export function readSeen(userId: string): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '{}');
  } catch {
    return {};
  }
}

export function markSeen(userId: string, dialogId: string, messageId: string) {
  try {
    const seen = readSeen(userId);
    seen[dialogId] = messageId;
    localStorage.setItem(storageKey(userId), JSON.stringify(seen));
  } catch {
    // Storage unavailable: the badge just stays, nothing else depends on it.
  }
}

export function isUnread(
  lastMessage: LastMessage | null,
  dialogId: string,
  myId: string,
  seen: SeenMap,
): boolean {
  return (
    lastMessage !== null &&
    lastMessage.sender._id !== myId &&
    seen[dialogId] !== lastMessage._id
  );
}

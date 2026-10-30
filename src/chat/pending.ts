// The api's send_message has no acknowledgement: success is only visible as
// the new_message broadcast echoed back to the sender, and chat_error says
// nothing about which message failed. So outgoing messages are tracked here
// and matched by text in send order. A socket.io ack carrying a client id
// would make this exact; until the api offers one, this is the best mapping.
export interface PendingMessage {
  tempId: string;
  text: string;
  status: 'sending' | 'failed';
  error?: string;
}

export function addPending(
  list: PendingMessage[],
  tempId: string,
  text: string,
): PendingMessage[] {
  return [...list, { tempId, text, status: 'sending' }];
}

// Prefers a message still sending; falls back to one already marked failed,
// since an error can be attributed to the wrong message before its echo lands.
export function confirmEcho(
  list: PendingMessage[],
  text: string,
): PendingMessage[] {
  let index = list.findIndex(
    (item) => item.status === 'sending' && item.text === text,
  );
  if (index === -1) index = list.findIndex((item) => item.text === text);
  return index === -1 ? list : list.filter((_, i) => i !== index);
}

function failAt(
  list: PendingMessage[],
  index: number,
  error: string,
): PendingMessage[] {
  return index === -1
    ? list
    : list.map((item, i) =>
        i === index ? { ...item, status: 'failed', error } : item,
      );
}

export function failOldest(
  list: PendingMessage[],
  error: string,
): PendingMessage[] {
  return failAt(
    list,
    list.findIndex((item) => item.status === 'sending'),
    error,
  );
}

// A rate limit rejects the sends that went over it — the latest ones.
export function failNewest(
  list: PendingMessage[],
  error: string,
): PendingMessage[] {
  return failAt(
    list,
    list.findLastIndex((item) => item.status === 'sending'),
    error,
  );
}

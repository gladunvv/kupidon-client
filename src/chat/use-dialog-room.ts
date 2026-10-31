import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { messageForCode } from '@/api/error-messages';
import {
  appendMessage,
  messagesKey,
  resyncMessages,
  type ChatMessage,
} from '@/api/messages';
import {
  addPending,
  confirmEcho,
  failNewest,
  failOldest,
  type PendingMessage,
} from '@/chat/pending';
import { useChatSocket } from '@/chat/socket';

interface NewMessagePayload {
  _id: string;
  text: string;
  sender: { _id: string; name?: string };
  dialogId: string;
  created_at: string;
  // Ignored: the api computes it for the sender and broadcasts it to the
  // whole room, so the partner receives `true` for messages they didn't send.
  isFromCurrentUser?: boolean;
}

const ECHO_TIMEOUT_MS = 10_000;
let nextTempId = 0;
export const MAX_MESSAGE_LENGTH = 1000;

export function useDialogRoom(dialogId: string, myId: string) {
  const { socket, status } = useChatSocket();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [roomError, setRoomError] = useState<string | null>(null);
  // Read only in event handlers (socket errors, retry), never during render.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    // Rooms don't survive a reconnect on the server, so join on every
    // `connect`, not just once.
    const join = () => socket.emit('join_dialog', { dialogId });
    // After every join — first open included, since a message can land
    // between the history fetch and the join — catch up on what the socket
    // didn't deliver. Only messages new to this client may settle a pending
    // send: an identical older text from history must not.
    const onJoined = (data: { dialogId: string }) => {
      if (data.dialogId !== dialogId) return;
      setRoomError(null);
      const known = new Set(
        queryClient
          .getQueryData<{ messages: ChatMessage[] }>(messagesKey(dialogId))
          ?.messages.map((m) => m._id),
      );
      resyncMessages(queryClient, dialogId)
        .then((fetched) => {
          const mineNew = fetched.filter(
            (m) => m.sender._id === myId && !known.has(m._id),
          );
          if (mineNew.length > 0) {
            setPending((list) =>
              mineNew.reduce((acc, m) => confirmEcho(acc, m.text), list),
            );
          }
        })
        // A failed catch-up is retried on the next join; the history query
        // shows its own error if loading is broken altogether.
        .catch(() => undefined);
    };
    const onMessage = (payload: NewMessagePayload) => {
      if (payload.dialogId !== dialogId) return;
      const message = {
        _id: String(payload._id),
        text: payload.text,
        sender: {
          _id: String(payload.sender._id),
          name: payload.sender.name,
        },
        created_at: payload.created_at,
      };
      appendMessage(queryClient, dialogId, message);
      if (message.sender._id === myId) {
        setPending((list) => confirmEcho(list, message.text));
      }
    };
    // chat_error carries no request context: with a send in flight it's
    // attributed to the oldest one, otherwise it concerns the room itself.
    const onError = (error: { code: string }) => {
      const text = messageForCode(error.code);
      if (pendingRef.current.some((item) => item.status === 'sending')) {
        const fail =
          error.code === 'TOO_MANY_MESSAGES' ? failNewest : failOldest;
        setPending((list) => fail(list, text));
      } else {
        setRoomError(text);
      }
    };

    socket.on('connect', join);
    socket.on('joined_dialog', onJoined);
    socket.on('new_message', onMessage);
    socket.on('chat_error', onError);
    if (socket.connected) join();
    return () => {
      socket.off('connect', join);
      socket.off('joined_dialog', onJoined);
      socket.off('new_message', onMessage);
      socket.off('chat_error', onError);
      if (socket.connected) socket.emit('leave_dialog', { dialogId });
    };
  }, [socket, dialogId, myId, queryClient]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || text.length > MAX_MESSAGE_LENGTH || !socket.connected) {
        return false;
      }
      // A counter, not crypto.randomUUID(): that one only exists on HTTPS.
      const tempId = `pending-${(nextTempId += 1)}`;
      setPending((list) => addPending(list, tempId, text));
      socket.emit('send_message', { dialogId, text });
      // No echo in time (e.g. the socket dropped mid-send): mark it failed so
      // it can be retried instead of spinning forever.
      setTimeout(() => {
        setPending((list) =>
          list.map((item) =>
            item.tempId === tempId && item.status === 'sending'
              ? { ...item, status: 'failed', error: 'Не доставлено' }
              : item,
          ),
        );
      }, ECHO_TIMEOUT_MS);
      return true;
    },
    [socket, dialogId],
  );

  const discard = useCallback((tempId: string) => {
    setPending((list) => list.filter((item) => item.tempId !== tempId));
  }, []);

  const retry = useCallback(
    (tempId: string) => {
      const item = pendingRef.current.find((p) => p.tempId === tempId);
      if (!item) return;
      discard(tempId);
      send(item.text);
    },
    [discard, send],
  );

  return { status, pending, roomError, send, retry, discard };
}

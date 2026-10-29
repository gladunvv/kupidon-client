import { useEffect, useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import { refreshSession } from '@/api/client';
import {
  getAccessToken,
  getSession,
  subscribeSession,
} from '@/auth/session-store';
import { env } from '@/config/env';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'failed';

let socket: Socket | null = null;
let users = 0;
let status: SocketStatus = 'idle';
let authRetries = 0;
const listeners = new Set<() => void>();

function setStatus(next: SocketStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function getSocket(): Socket {
  if (socket) return socket;
  socket = io(env.wsUrl, {
    autoConnect: false,
    // A function, so every (re)connect attempt sends the current token —
    // the api checks it only at handshake.
    auth: (cb) => cb({ token: getAccessToken() }),
  });
  socket.on('connect', () => {
    authRetries = 0;
    setStatus('connected');
  });
  socket.on('disconnect', () => {
    // socket.active: the client will retry by itself (network drop, server
    // restart); otherwise we disconnected on purpose.
    setStatus(socket?.active ? 'connecting' : 'idle');
  });
  socket.on('connect_error', async (error) => {
    if (socket?.active) {
      // Transport-level failure: socket.io keeps retrying with backoff.
      setStatus('connecting');
      return;
    }
    // Rejected by the api's auth middleware (typically an expired access
    // token after a reconnect). socket.io won't retry this on its own:
    // refresh once and reconnect; a second rejection in a row stops here.
    if (error.message === 'Authentication failed' && authRetries < 1) {
      authRetries += 1;
      setStatus('connecting');
      if (await refreshSession()) {
        socket?.connect();
        return;
      }
    }
    setStatus('failed');
  });
  return socket;
}

function connectIfNeeded() {
  if (users > 0 && getSession().status === 'authenticated') {
    const s = getSocket();
    if (!s.connected && !s.active) {
      setStatus('connecting');
      s.connect();
    }
  }
}

function disconnect() {
  socket?.disconnect();
  authRetries = 0;
  setStatus('idle');
}

subscribeSession(() => {
  if (getSession().status === 'unauthenticated') disconnect();
  else connectIfNeeded();
});

// Ref-counted: the socket is open only while some screen needs it (chat), and
// closes on sign-out regardless.
export function useChatSocket(): { socket: Socket; status: SocketStatus } {
  useEffect(() => {
    users += 1;
    connectIfNeeded();
    return () => {
      users -= 1;
      if (users === 0) disconnect();
    };
  }, []);

  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
  );
  return { socket: getSocket(), status: current };
}

export function retryChatSocket() {
  authRetries = 0;
  disconnect();
  connectIfNeeded();
}

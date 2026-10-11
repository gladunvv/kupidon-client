import { useSyncExternalStore } from 'react';
import { getSession, subscribeSession } from '@/auth/session-store';

export function useAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession);
  return {
    status: session.status,
    user: session.status === 'authenticated' ? session.user : null,
  };
}

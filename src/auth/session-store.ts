import type { AuthResponse } from '@/types/auth';
import type { User } from '@/types/user';

export type Session =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; accessToken: string; user: User };

// In-memory only, never localStorage/sessionStorage: after a reload the
// session is restored from the httpOnly refresh cookie (refreshSession).
let session: Session = { status: 'loading' };
const listeners = new Set<() => void>();

export function getSession(): Session {
  return session;
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSession(next: Session): void {
  session = next;
  listeners.forEach((listener) => listener());
}

export function signIn(response: AuthResponse): void {
  setSession({
    status: 'authenticated',
    accessToken: response.access_token,
    user: response.user,
  });
}

export function signOut(): void {
  setSession({ status: 'unauthenticated' });
}

export function getAccessToken(): string | null {
  return session.status === 'authenticated' ? session.accessToken : null;
}

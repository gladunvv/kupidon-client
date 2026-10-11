import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse } from '@/types/auth';
import type { User } from '@/types/user';

interface Session {
  accessToken: string;
  user: User;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// Session lives in memory only, never in localStorage/sessionStorage: a page
// reload drops it until AUTH-03 restores it via the httpOnly refresh cookie.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = useCallback((response: AuthResponse) => {
    setSession({ accessToken: response.access_token, user: response.user });
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: session !== null,
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

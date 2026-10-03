import { createContext, useContext, type ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
}

// Placeholder until AUTH-03 wires up real access-token state (in-memory,
// filled by OTP verify / silent refresh). Always false for now so route
// guards have something real to test against.
const AuthContext = createContext<AuthState>({ isAuthenticated: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ isAuthenticated: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

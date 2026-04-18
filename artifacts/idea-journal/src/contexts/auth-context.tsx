import { createContext, useContext, type ReactNode } from "react";

interface AuthUser {
  userId: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultUser: AuthUser = { userId: 1, name: "Guest", email: "guest@planora.app" };

const AuthContext = createContext<AuthContextValue>({
  user: defaultUser,
  loading: false,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: defaultUser, loading: false, signOut: async () => {}, refresh: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

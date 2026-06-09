import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { authClient } from '../lib/auth-client';

export type AdminRole = 'admin' | 'editor' | 'user';

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  isPending: boolean;
  role: AdminRole | null;
  userName: string | null;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user as ({ active?: boolean; role?: string } & typeof session.user) | undefined;
  const isAuthenticated = !!session && user?.active !== false;
  const role: AdminRole | null = (() => {
    if (!isAuthenticated) return null;
    const r = user?.role;
    if (r === 'admin' || r === 'editor' || r === 'user') return r;
    return 'editor';
  })();

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        fetchOptions: { credentials: 'include' },
      });
      if (error || !data) return false;

      const signedInUser = data.user as { active?: boolean };
      if (signedInUser?.active === false) {
        await authClient.signOut();
        return false;
      }

      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    authClient.signOut();
  }, []);

  const userName = isAuthenticated ? (user?.name ?? null) : null;
  const userEmail = isAuthenticated ? (user?.email ?? null) : null;

  const value = useMemo(
    () => ({ isAuthenticated, isPending, role, userName, userEmail, login, logout }),
    [isAuthenticated, isPending, role, userName, userEmail, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}

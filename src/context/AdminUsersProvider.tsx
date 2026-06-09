import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { trpc } from '../lib/trpc';
import type { AdminUser, AdminUserRole } from '../lib/adminUsers';
import { useAdminAuth } from './AdminAuthProvider';

type AdminUsersContextValue = {
  users: AdminUser[];
  isLoading: boolean;
  addUser: (input: {
    name: string;
    email: string;
    role: AdminUserRole;
    password: string;
    active: boolean;
  }) => Promise<{ ok: true } | { ok: false; reason: string }>;
  updateUser: (
    id: string,
    input: {
      name: string;
      email: string;
      role: AdminUserRole;
      active: boolean;
      password?: string;
    },
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  removeUser: (id: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  refreshUsers: () => void;
};

const AdminUsersContext = createContext<AdminUsersContextValue | null>(null);

function extractMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Operação falhou. Tente novamente.';
}

export function AdminUsersProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const { role } = useAdminAuth();
  const canManage = role === 'admin';

  const { data: rawUsers = [], isLoading } = trpc.adminUsers.list.useQuery(
    undefined,
    { enabled: canManage },
  );

  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => { utils.adminUsers.list.invalidate(); },
  });
  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => { utils.adminUsers.list.invalidate(); },
  });
  const deleteMutation = trpc.adminUsers.delete.useMutation({
    onSuccess: () => { utils.adminUsers.list.invalidate(); },
  });

  const users: AdminUser[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as AdminUserRole,
    active: u.active,
    createdAt: String(u.createdAt),
  }));

  const refreshUsers = useCallback(() => {
    utils.adminUsers.list.invalidate();
  }, [utils]);

  const addUser = useCallback(
    async (input: {
      name: string;
      email: string;
      role: AdminUserRole;
      password: string;
      active: boolean;
    }): Promise<{ ok: true } | { ok: false; reason: string }> => {
      try {
        await createMutation.mutateAsync(input);
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: extractMessage(err) };
      }
    },
    [createMutation],
  );

  const updateUser = useCallback(
    async (
      id: string,
      input: {
        name: string;
        email: string;
        role: AdminUserRole;
        active: boolean;
        password?: string;
      },
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      try {
        const updateInput: { id: string; name: string; email: string; role: AdminUserRole; active: boolean; password?: string } = {
          id,
          name: input.name,
          email: input.email,
          role: input.role,
          active: input.active,
        };
        if (input.password && input.password.length > 0) {
          updateInput.password = input.password;
        }
        await updateMutation.mutateAsync(updateInput);
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: extractMessage(err) };
      }
    },
    [updateMutation],
  );

  const removeUser = useCallback(
    async (id: string): Promise<{ ok: true } | { ok: false; reason: string }> => {
      try {
        await deleteMutation.mutateAsync({ id });
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: extractMessage(err) };
      }
    },
    [deleteMutation],
  );

  const value = useMemo(
    () => ({ users, isLoading, addUser, updateUser, removeUser, refreshUsers }),
    [users, isLoading, addUser, updateUser, removeUser, refreshUsers],
  );

  return (
    <AdminUsersContext.Provider value={value}>
      {children}
    </AdminUsersContext.Provider>
  );
}

export function useAdminUsers() {
  const ctx = useContext(AdminUsersContext);
  if (!ctx) {
    throw new Error('useAdminUsers must be used within AdminUsersProvider');
  }
  return ctx;
}

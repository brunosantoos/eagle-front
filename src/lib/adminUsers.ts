export type AdminUserRole = 'admin' | 'editor' | 'user';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  password?: string;
  active: boolean;
  createdAt: string;
};

export const ADMIN_USERS_STORAGE_KEY = 'eagle-admin-users-v1';

export function getDefaultAdminUsers(): AdminUser[] {
  return [
    {
      id: 'default-admin',
      name: 'Administrador',
      email: 'admin@admin.com',
      role: 'admin',
      password: 'admin@123',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function normalizeUser(raw: unknown): AdminUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' ? o.id : '';
  const name = typeof o.name === 'string' ? o.name : '';
  const email = typeof o.email === 'string' ? o.email : '';
  const password = typeof o.password === 'string' ? o.password : '';
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : '';
  const role: AdminUserRole =
    o.role === 'admin' ? 'admin' : o.role === 'user' ? 'user' : 'editor';
  const active = o.active !== false;
  if (!id || !email) return null;
  return {
    id,
    name: name || email.split('@')[0] || 'Usuário',
    email,
    role,
    password,
    active,
    createdAt: createdAt || new Date().toISOString(),
  };
}

export function loadAdminUsers(): AdminUser[] {
  if (typeof window === 'undefined') return getDefaultAdminUsers();
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      const seed = getDefaultAdminUsers();
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      const seed = getDefaultAdminUsers();
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const users = parsed
      .map(normalizeUser)
      .filter((u): u is AdminUser => u !== null);
    if (users.length === 0) {
      const seed = getDefaultAdminUsers();
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return users;
  } catch {
    const seed = getDefaultAdminUsers();
    try {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
    return seed;
  }
}

export function persistAdminUsers(users: AdminUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    /* ignore quota */
  }
}

export function validateAdminCredentials(
  email: string,
  password: string,
): boolean {
  if (typeof window === 'undefined') return false;
  const normalizedEmail = email.trim().toLowerCase();
  const users = loadAdminUsers();
  return users.some(
    (u) =>
      u.active &&
      u.email.toLowerCase() === normalizedEmail &&
      u.password === password,
  );
}

export function countActiveAdmins(users: AdminUser[]): number {
  return users.filter((u) => u.active && u.role === 'admin').length;
}

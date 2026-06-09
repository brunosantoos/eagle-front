/// <reference types="vite/client" />
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: (import.meta.env.VITE_BACKEND_URL as string) ?? 'http://localhost:3001',
});

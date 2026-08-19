/// <reference types="vite/client" />
import { toStoredMediaUrl } from './mediaUrl';

const BACKEND_URL = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  'http://localhost:3001'
).replace(/\/+$/, '');

/**
 * Envia um arquivo para `POST /api/upload` e devolve o caminho já normalizado
 * (`/uploads/<arquivo>`) para gravar no conteúdo do site.
 */
export async function uploadFile(
  file: Blob,
  filename = 'upload',
): Promise<string> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ? ` — ${body.error}` : '';
    } catch {
      /* resposta sem JSON */
    }
    throw new Error(`Falha no upload (${res.status})${detail}`);
  }
  const data = (await res.json()) as { url: string };
  return toStoredMediaUrl(data.url);
}

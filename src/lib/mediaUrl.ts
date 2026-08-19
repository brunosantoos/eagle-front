/// <reference types="vite/client" />

/**
 * Resolução de URL de mídia.
 *
 * Uploads são gravados no SiteContent como caminho relativo (`/uploads/<arquivo>`).
 * O host do backend entra só na hora de renderizar, via `VITE_BACKEND_URL`.
 *
 * Isso conserta o caso em que a mídia foi enviada num ambiente (ex.: dev,
 * `http://localhost:3001`) e depois o site roda em outro domínio: a URL absoluta
 * antiga quebrava e a imagem não replicava. URLs `/uploads/...` com host antigo
 * gravadas antes desta mudança são reapontadas para o backend atual.
 */

const BACKEND_URL = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  'http://localhost:3001'
).replace(/\/+$/, '');

const UPLOAD_PATH = /^\/uploads\//i;

/** Hosts cujos `/uploads/...` pertencem ao backend (e por isso são reapontados). */
function isBackendHost(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized.startsWith('localhost') || normalized.startsWith('127.0.0.1')) {
    return true;
  }
  try {
    return normalized === new URL(BACKEND_URL).host.toLowerCase();
  } catch {
    return false;
  }
}

/** Caminho de upload (relativo) para URL absoluta do backend atual. */
function toBackendUrl(pathname: string): string {
  return `${BACKEND_URL}${pathname}`;
}

/** URL pronta para `src` de `<img>` / `<video>`. Aceita vazio, relativo ou absoluto. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const value = url.trim();
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      // Só reaponta o que é do backend. URL de bucket (S3/Spaces) fica como está,
      // mesmo que a pasta lá dentro se chame "uploads".
      if (UPLOAD_PATH.test(parsed.pathname) && isBackendHost(parsed.host)) {
        return toBackendUrl(`${parsed.pathname}${parsed.search}`);
      }
      return value;
    } catch {
      return value;
    }
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  if (UPLOAD_PATH.test(path)) return toBackendUrl(path);

  // Asset servido pelo próprio front (ex.: /logo.png em public/).
  return value;
}

/** Normaliza o valor devolvido pelo upload antes de gravar no conteúdo. */
export function toStoredMediaUrl(url: string): string {
  const value = url.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      // URL do backend vira caminho relativo; URL de bucket é guardada inteira,
      // porque o arquivo não está no servidor da API.
      if (UPLOAD_PATH.test(parsed.pathname) && isBackendHost(parsed.host)) {
        return parsed.pathname;
      }
    } catch {
      return value;
    }
  }
  return value;
}

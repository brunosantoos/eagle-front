/// <reference types="vite/client" />
import { compressImageForUpload, formatBytes } from './imageCompress';
import { toStoredMediaUrl } from './mediaUrl';

const BACKEND_URL = (
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  'http://localhost:3001'
).replace(/\/+$/, '');

export type UploadResult = {
  /** Caminho já normalizado para gravar no conteúdo do site. */
  url: string;
  /** Tamanho do arquivo escolhido pelo usuário. */
  originalSize: number;
  /** Tamanho do que foi realmente armazenado. */
  finalSize: number;
  /** true quando houve compressão (no navegador ou no servidor). */
  compressed: boolean;
};

/**
 * Envia um arquivo para `POST /api/upload` e devolve o caminho já normalizado
 * (`/uploads/<arquivo>`) para gravar no conteúdo do site.
 *
 * Imagem é comprimida no navegador antes de subir (ver `imageCompress.ts`) e o
 * backend comprime de novo o que passar direto — o site nunca recebe o arquivo
 * original de 9 MB que sai do designer.
 */
export async function uploadFileDetailed(
  file: Blob,
  filename = 'upload',
): Promise<UploadResult> {
  const prepared = await compressImageForUpload(file, filename);

  const form = new FormData();
  form.append('file', prepared.blob, prepared.filename);
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
  const data = (await res.json()) as {
    url: string;
    optimized?: boolean;
    size?: number;
  };

  const finalSize = data.size ?? prepared.blob.size;
  return {
    url: toStoredMediaUrl(data.url),
    originalSize: prepared.originalSize,
    finalSize,
    compressed: prepared.compressed || Boolean(data.optimized),
  };
}

/** Versão curta — só a URL. Mantida para quem não exibe o resumo. */
export async function uploadFile(
  file: Blob,
  filename = 'upload',
): Promise<string> {
  return (await uploadFileDetailed(file, filename)).url;
}

/** 'Comprimida: 9.15 MB → 180 KB (-98%)' para mostrar no painel. */
export function describeCompression(result: UploadResult): string | null {
  if (!result.compressed || result.finalSize >= result.originalSize) return null;
  const saved = Math.round(
    (1 - result.finalSize / result.originalSize) * 100,
  );
  return `Comprimida: ${formatBytes(result.originalSize)} → ${formatBytes(
    result.finalSize,
  )} (-${saved}%)`;
}

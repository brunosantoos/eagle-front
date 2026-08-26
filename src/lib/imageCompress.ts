/**
 * Compressão da imagem no navegador, antes de subir.
 *
 * O backend também comprime (ver `eagle-back/src/lib/imageOptimize.ts`), mas
 * comprimir aqui é o que salva o tempo do usuário: sem isso, um PNG de 9 MB
 * ainda precisa atravessar o upload inteiro antes de virar 180 KB no servidor.
 *
 * Falha de qualquer etapa devolve o arquivo original — o upload nunca depende
 * desta função ter dado certo.
 */

/** Maior lado permitido; acima disso a imagem é reduzida proporcionalmente. */
const MAX_DIMENSION = 2560;

/** Qualidade do WebP (0-1). Igual à do backend. */
const QUALITY = 0.82;

/** Abaixo disso não vale reprocessar. */
const MIN_BYTES = 60 * 1024;

/** Formatos que o canvas reprocessa com segurança (SVG e GIF ficam de fora). */
const COMPRESSIBLE = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
]);

export type CompressResult = {
  blob: Blob;
  filename: string;
  /** true quando a imagem foi realmente reprocessada. */
  compressed: boolean;
  originalSize: number;
};

function webpNameFor(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return `${base}.webp`;
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // `createImageBitmap` decodifica fora da thread principal — não trava a UI
  // com foto grande. Safari antigo cai no <img> como alternativa.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* cai no fallback */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = url;
    });
  } finally {
    // Revoga no próximo tick: o <img> já terminou de decodificar.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

/**
 * Reduz e converte para WebP. Devolve o original quando não compensa
 * (arquivo pequeno, formato não suportado, resultado maior que a entrada).
 */
export async function compressImageForUpload(
  file: File | Blob,
  filename: string,
): Promise<CompressResult> {
  const keep: CompressResult = {
    blob: file,
    filename,
    compressed: false,
    originalSize: file.size,
  };

  if (!COMPRESSIBLE.has(file.type.toLowerCase())) return keep;
  if (file.size < MIN_BYTES) return keep;

  try {
    const source = await decode(file);
    const width = 'width' in source ? source.width : 0;
    const height = 'height' in source ? source.height : 0;
    if (!width || !height) return keep;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return keep;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ('close' in source) source.close();

    const blob = await toBlob(canvas, 'image/webp', QUALITY);
    // Libera a memória do canvas grande imediatamente.
    canvas.width = 0;
    canvas.height = 0;

    if (!blob || blob.size >= file.size) return keep;

    return {
      blob,
      filename: webpNameFor(filename),
      compressed: true,
      originalSize: file.size,
    };
  } catch {
    return keep;
  }
}

/** '9.15 MB' — usado nas mensagens do painel. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

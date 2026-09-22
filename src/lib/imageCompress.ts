/**
 * Rede de segurança para arquivo absurdo, antes de subir.
 *
 * **A imagem do cliente não é mais reprocessada por padrão.** Antes toda foto
 * acima de 60 KB era reduzida para 2560px e reencodada em WebP q82 aqui, e
 * depois o servidor fazia a mesma coisa de novo — duas perdas de qualidade
 * empilhadas em cima de um arquivo que já vinha comprimido da câmera. O
 * resultado era visível: uma foto de 832 KB chegava ao site com 285 KB.
 *
 * Compressão passou a ser um ato explícito, no botão "Comprimir imagens já
 * enviadas" (Admin > Mídias). Aqui só sobra o caso extremo: arquivo tão grande
 * que o upload travaria ou estouraria o limite de 200 MB da API.
 *
 * Falha de qualquer etapa devolve o arquivo original — o upload nunca depende
 * desta função ter dado certo.
 */

/**
 * Teto de tamanho no maior lado, aplicado só quando a rede de segurança entra.
 * Alto de propósito: é o dobro do maior hero do site, então mesmo o arquivo
 * reduzido continua com folga de detalhe.
 */
const SAFETY_DIMENSION = 4500;

/** Qualidade do WebP (0-1) quando a rede de segurança precisa reencodar. */
const QUALITY = 0.95;

/**
 * A partir deste tamanho o arquivo é reduzido antes de subir. Abaixo disso a
 * imagem sobe **exatamente como o cliente escolheu**, sem reencode.
 */
const SAFETY_BYTES = 15 * 1024 * 1024;

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
 * Devolve o arquivo do jeito que veio, salvo quando ele é grande demais para
 * subir — aí sim reduz e converte para WebP em qualidade alta.
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
  // O caminho normal para de mexer no arquivo aqui.
  if (file.size < SAFETY_BYTES) return keep;

  try {
    const source = await decode(file);
    const width = 'width' in source ? source.width : 0;
    const height = 'height' in source ? source.height : 0;
    if (!width || !height) return keep;

    const scale = Math.min(1, SAFETY_DIMENSION / Math.max(width, height));
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

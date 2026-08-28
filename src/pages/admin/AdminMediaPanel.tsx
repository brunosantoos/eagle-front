/// <reference types="vite/client" />
import { useState, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Pencil,
  Trash2,
  Wand2,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { formatBytes } from '../../lib/imageCompress';
import type { SiteMedia } from '../../lib/siteContent';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { describeCompression, uploadFileDetailed } from '../../lib/upload';
import {
  ImageCropModal,
  type ImageEffectsConfig,
} from '../../components/admin/ImageCropModal';

/**
 * Proporção **real** de cada campo, medida no componente que exibe a imagem no
 * site — não é uma sugestão de tamanho, é o formato do espaço.
 *
 * Por que isso existe: o recorte usava a dimensão recomendada e o modal
 * arredondava para o preset genérico mais próximo. Um campo 1200x1600 (3:4)
 * virava 4:5 na hora de recortar, e o enquadramento nunca fechava com o site.
 *
 * `fit: 'contain'` = a imagem aparece inteira (logo); recorte fixo não faz
 * sentido e o modal abre em "Original".
 */
type FieldFraming = {
  /** Proporção exata do espaço no site, ex.: '735/791'. */
  aspect?: string;
  /** Explicação do enquadramento, exibida no editor de recorte. */
  note?: string;
};

const FIELD_META: {
  key: keyof SiteMedia;
  title: string;
  hint: string;
  kind: 'image' | 'video';
  /** Dimensão recomendada exibida junto ao campo de upload. */
  dimension?: string;
  framing?: FieldFraming;
}[] = [
  {
    key: 'navLogo',
    dimension: '360x120px',
    title: 'Menu — logo principal',
    hint: 'Ex.: /logo.png ou URL absoluta.',
    kind: 'image',
    framing: { note: 'Aparece inteiro no menu, sem corte — envie com fundo transparente.' },
  },
  {
    key: 'navEagle',
    dimension: '200x200px',
    title: 'Menu — águia',
    hint: 'Ex.: /eagle.png',
    kind: 'image',
    framing: { note: 'Aparece inteiro no menu, sem corte.' },
  },
  {
    key: 'footerLogo',
    dimension: '360x120px',
    title: 'Rodapé — logo',
    hint: 'Ex.: /logo.png',
    kind: 'image',
    framing: { note: 'Aparece inteiro no rodapé, sem corte.' },
  },
  {
    key: 'homeHeroVideo',
    title: 'Home — vídeo do primeiro hero',
    hint: 'Ex.: /video.mp4',
    kind: 'video',
  },
  {
    key: 'homeSecondHeroBg',
    dimension: '1920x1080px',
    title: 'Home — fundo do segundo hero',
    hint: 'Imagem grande atrás do título principal.',
    kind: 'image',
    framing: {
      aspect: '16/9',
      note: 'Preenche a tela inteira (altura de 100vh). Deixe o essencial no centro: as bordas somem em telas mais estreitas.',
    },
  },
  {
    key: 'homeExperienceImage',
    dimension: '1200x1250px',
    title: 'Home — imagem da seção experiência',
    hint: 'Lado direito do bloco com lista.',
    kind: 'image',
    framing: {
      aspect: '24/25',
      note: 'Bloco de altura fixa (600px) ao lado do texto — quase quadrado no desktop.',
    },
  },
  {
    key: 'homeFranchiseTeaserImage',
    dimension: '735x791px',
    title: 'Home — imagem do bloco franquia',
    hint: 'Grid grande antes do rodapé.',
    kind: 'image',
    framing: {
      aspect: '735/791',
      note: 'Proporção fixa no site (735:791) — este recorte é exatamente o que aparece.',
    },
  },
  {
    key: 'aboutHeroBg',
    dimension: '1920x1080px',
    title: 'Sobre — fundo do hero',
    hint: 'Imagem atrás do título da página.',
    kind: 'image',
    framing: {
      aspect: '16/9',
      note: 'Faixa larga no topo da página (altura mínima de 60vh), com o título por cima.',
    },
  },
  {
    key: 'aboutStoryImage',
    dimension: '800x800px',
    title: 'Sobre — imagem ao lado da história',
    hint: 'Ex.: /logo_draw.png',
    kind: 'image',
    framing: {
      note: 'Aparece inteira, na proporção do arquivo — não é cortada pelo site.',
    },
  },
  {
    key: 'aboutPillarsImage',
    dimension: '1200x1200px',
    title: 'Sobre — imagem dos pilares',
    hint: 'Quadrado ao lado dos textos dos pilares.',
    kind: 'image',
    framing: {
      aspect: '1/1',
      note: 'Quadrado exato no site (aspect-square).',
    },
  },
  {
    key: 'franchiseHeroBg',
    dimension: '1920x1080px',
    title: 'Franquia — imagem lateral do hero',
    hint: 'Campo sem uso: o hero da Franquia mostra o vídeo, não esta imagem.',
    kind: 'image',
  },
  {
    key: 'franchiseHeroVideo',
    title: 'Franquia — vídeo do hero',
    hint: 'Ex.: /franquia.mp4 — exibido em pé (9:16).',
    kind: 'video',
  },
];

function UploadField({
  kind,
  dimension,
  onUploaded,
}: {
  kind: 'image' | 'video';
  dimension?: string;
  onUploaded: (url: string) => void;
}) {
  const accept = kind === 'video' ? 'video/*' : 'image/*';
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Resumo da compressão do último envio (ex.: '9.15 MB → 180 KB'). */
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setCompressionNote(null);
    try {
      // Caminho relativo — host resolvido no render (ver lib/mediaUrl.ts).
      const result = await uploadFileDetailed(file, file.name);
      onUploaded(result.url);
      setCompressionNote(describeCompression(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-zinc-600/70 bg-zinc-950/50 p-4 space-y-3">
      <p className="text-xs font-medium text-zinc-400">Enviar novo arquivo</p>
      {dimension && (
        <p className="text-[11px] font-medium text-eagle-gold/90">
          Dimensão recomendada: {dimension}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="block w-full text-xs text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-300 file:cursor-pointer"
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading}
        className="w-full py-2 rounded-lg text-xs font-medium bg-eagle-red hover:bg-red-700 disabled:opacity-50 text-white border-0"
      >
        {uploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {!error && compressionNote && (
        <p className="text-[11px] text-emerald-400/90">{compressionNote}</p>
      )}
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        A imagem vai para o site na qualidade original. Só arquivo fora de escala
        (acima de 4500px ou 15 MB) é reduzido, para o site não travar.
      </p>
    </div>
  );
}


/**
 * Compressão do acervo já enviado — o **único** lugar onde a imagem do site é
 * recomprimida de propósito.
 *
 * O upload não mexe mais na qualidade (ver `eagle-back/src/lib/imageOptimize.ts`),
 * então comprimir passou a ser uma decisão de quem está no painel. A rotina só
 * lista o que realmente pesa: acima de 1,5 MB ou fora de escala. Nome e extensão
 * são preservados, então nenhuma referência do site quebra.
 *
 * Fluxo em dois passos de propósito: a análise mostra o que vai acontecer antes
 * de reescrever arquivo, porque a operação não tem desfazer.
 */
function UploadsOptimizer() {
  type Report = {
    applied: boolean;
    files: { name: string; before: number; after: number; resizedFrom: string | null }[];
    totalBefore: number;
    totalAfter: number;
    failed: string[];
    remoteStorage: boolean;
  };

  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = trpc.mediaLibrary.scanUploads.useMutation({
    onSuccess: (data) => {
      setReport(data as Report);
      setError(null);
    },
    onError: (err) => setError(err.message || 'Falha ao analisar as imagens.'),
  });

  const optimize = trpc.mediaLibrary.optimizeUploads.useMutation({
    onSuccess: (data) => {
      setReport(data as Report);
      setError(null);
    },
    onError: (err) => setError(err.message || 'Falha ao comprimir as imagens.'),
  });

  const running = scan.isPending || optimize.isPending;
  const saved = report ? report.totalBefore - report.totalAfter : 0;
  const savedPct =
    report && report.totalBefore > 0
      ? Math.round((saved / report.totalBefore) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-heading font-semibold text-white flex items-center gap-2">
            <Wand2 size={15} className="text-eagle-gold shrink-0" />
            Comprimir imagens já enviadas
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
            O upload não mexe na qualidade da sua imagem. Use este botão quando
            o site estiver pesado: ele lista só as imagens acima de 1,5 MB ou
            fora de escala e recomprime em qualidade alta, mantendo o mesmo nome
            de arquivo. Analise antes — a compressão não tem desfazer.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scan.mutate()}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {scan.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Wand2 size={13} />
            )}
            Analisar
          </button>
          {report && !report.applied && report.files.length > 0 && (
            <button
              type="button"
              onClick={() => optimize.mutate()}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-eagle-red hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
            >
              {optimize.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              Comprimir agora
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {report?.remoteStorage && (
        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 leading-relaxed">
          As mídias estão indo para um bucket externo (Armazenamento). Só os
          arquivos que ficaram no disco do servidor são processados aqui.
        </p>
      )}

      {report && report.files.length === 0 && !error && (
        <p className="text-xs text-emerald-400/90">
          Nenhuma imagem para comprimir — o acervo já está otimizado.
        </p>
      )}

      {report && report.files.length > 0 && (
        <div className="space-y-3">
          <p
            className={`text-xs ${report.applied ? 'text-emerald-400' : 'text-eagle-gold'}`}
          >
            {report.applied
              ? `Pronto: ${report.files.length} imagem(ns) comprimida(s) · ${formatBytes(report.totalBefore)} → ${formatBytes(report.totalAfter)} (-${savedPct}%)`
              : `${report.files.length} imagem(ns) podem encolher · ${formatBytes(report.totalBefore)} → ${formatBytes(report.totalAfter)} (-${savedPct}%). Nada foi alterado ainda.`}
          </p>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/70">
            {report.files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
              >
                <span className="text-zinc-400 truncate min-w-0">
                  {file.name}
                  {file.resizedFrom && (
                    <span className="text-zinc-600"> · {file.resizedFrom}</span>
                  )}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {formatBytes(file.before)}{' '}
                  <span className="text-emerald-400">
                    → {formatBytes(file.after)}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {report.failed.length > 0 && (
            <p className="text-xs text-amber-300/90 flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              {report.failed.length} arquivo(s) não puderam ser processados e
              ficaram como estavam.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminMediaPanel({
  media,
  onMediaChange,
  onSave,
  effectsFor,
}: {
  media: SiteMedia;
  onMediaChange: (next: SiteMedia) => void;
  onSave: () => void;
  /** Máscara/desfoque do campo. Ausente = campo só permite recorte. */
  effectsFor?: (key: keyof SiteMedia) => ImageEffectsConfig | undefined;
}) {
  const [cropField, setCropField] = useState<{
    key: keyof SiteMedia;
    title: string;
    aspect?: string;
    note?: string;
  } | null>(null);

  const patch = (key: keyof SiteMedia, value: string) => {
    onMediaChange({ ...media, [key]: value });
  };

  return (
    <section className="border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-zinc-900/25 shadow-xl shadow-black/30">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="text-eagle-gold shrink-0" size={22} />
            Imagens e vídeos
          </h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-xl">
            Pré-visualização e URL de cada mídia usada hoje no site. As fotos dos
            cards de treino na Home continuam na seção &quot;Página inicial&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 text-white text-sm font-heading font-semibold shadow-lg shadow-red-900/25 shrink-0"
        >
          Salvar mídias
        </button>
      </div>

      <UploadsOptimizer />

      <div className="space-y-10 mt-10">
        {FIELD_META.map(({ key, title, hint, kind, dimension, framing }) => {
          const url = media[key];
          return (
            <div
              key={key}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/30"
            >
              <div className="space-y-3 min-w-0">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-white">
                    {title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{hint}</p>
                </div>
                <UploadField
                  kind={kind}
                  dimension={dimension}
                  onUploaded={(url) => patch(key, url)}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  Pré-visualização
                </p>
                <div className="flex-1 min-h-[140px] rounded-xl border border-zinc-800 bg-black/50 overflow-hidden flex items-center justify-center p-4">
                  {kind === 'image' ? (
                    url ? (
                      <img
                        src={resolveMediaUrl(url)}
                        alt=""
                        className="max-w-full max-h-[220px] w-auto h-auto object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity =
                            '0.35';
                        }}
                      />
                    ) : (
                      <span className="text-zinc-600 text-xs text-center">
                        Sem URL para pré-visualizar
                      </span>
                    )
                  ) : url ? (
                    <video
                      key={url}
                      src={resolveMediaUrl(url)}
                      muted
                      playsInline
                      controls
                      className="max-w-full max-h-[220px] w-auto h-auto"
                    />
                  ) : (
                    <span className="text-zinc-600 text-xs text-center">
                      Sem URL para pré-visualizar
                    </span>
                  )}
                </div>
                {!url ? (
                  <p className="text-xs text-amber-600/90 mt-2">
                    Sem mídia — o site não exibe nada neste espaço.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {kind === 'image' && (
                      <button
                        type="button"
                        onClick={() =>
                          setCropField({
                            key,
                            title,
                            aspect: framing?.aspect,
                            note: framing?.note,
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-eagle-gold transition-colors"
                      >
                        <Pencil size={12} />
                        Editar imagem
                      </button>
                    )}
                    {/*
                      Esvazia o campo. O arquivo continua no servidor — só a
                      referência sai do conteúdo, então dá para voltar atrás
                      enquanto a seção não for salva.
                    */}
                    <button
                      type="button"
                      onClick={() => patch(key, '')}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                      Remover {kind === 'video' ? 'vídeo' : 'imagem'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ImageCropModal
        open={cropField !== null}
        value={cropField ? media[cropField.key] : ''}
        aspect={cropField?.aspect}
        fieldLabel={cropField?.title}
        fieldNote={cropField?.note}
        effects={cropField ? effectsFor?.(cropField.key) : undefined}
        onClose={() => setCropField(null)}
        onCropped={(url) => {
          if (cropField) patch(cropField.key, url);
        }}
      />

      <div className="flex justify-end pt-8 mt-8 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 text-white text-sm font-heading font-semibold shadow-lg shadow-red-900/30"
        >
          Salvar mídias no site
        </button>
      </div>
    </section>
  );
}

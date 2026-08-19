/// <reference types="vite/client" />
import { useState, useRef } from 'react';
import { ImageIcon, Pencil } from 'lucide-react';
import type { SiteMedia } from '../../lib/siteContent';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { uploadFile } from '../../lib/upload';
import {
  ImageCropModal,
  type ImageEffectsConfig,
} from '../../components/admin/ImageCropModal';

/** '1900x1500px' -> '1900/1500' (proporção sugerida no editor de recorte). */
function aspectFromDimension(dimension?: string): string | undefined {
  const match = dimension?.match(/(\d+)\s*[x×]\s*(\d+)/i);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

const FIELD_META: {
  key: keyof SiteMedia;
  title: string;
  hint: string;
  kind: 'image' | 'video';
  /** Dimensão recomendada exibida junto ao campo de upload. */
  dimension?: string;
}[] = [
  {
    key: 'navLogo',
    dimension: '360x120px',
    title: 'Menu — logo principal',
    hint: 'Ex.: /logo.png ou URL absoluta.',
    kind: 'image',
  },
  {
    key: 'navEagle',
    dimension: '200x200px',
    title: 'Menu — águia',
    hint: 'Ex.: /eagle.png',
    kind: 'image',
  },
  {
    key: 'footerLogo',
    dimension: '360x120px',
    title: 'Rodapé — logo',
    hint: 'Ex.: /logo.png',
    kind: 'image',
  },
  {
    key: 'homeHeroVideo',
    title: 'Home — vídeo do primeiro hero',
    hint: 'Ex.: /video.mp4',
    kind: 'video',
  },
  {
    key: 'homeSecondHeroBg',
    dimension: '1900x1500px',
    title: 'Home — fundo do segundo hero',
    hint: 'Imagem grande atrás do título principal.',
    kind: 'image',
  },
  {
    key: 'homeExperienceImage',
    dimension: '1200x1600px',
    title: 'Home — imagem da seção experiência',
    hint: 'Lado direito do bloco com lista.',
    kind: 'image',
  },
  {
    key: 'homeFranchiseTeaserImage',
    dimension: '735x791px',
    title: 'Home — imagem do bloco franquia',
    hint: 'Grid grande antes do rodapé.',
    kind: 'image',
  },
  {
    key: 'aboutHeroBg',
    dimension: '1900x1080px',
    title: 'Sobre — fundo do hero',
    hint: 'Imagem atrás do título da página.',
    kind: 'image',
  },
  {
    key: 'aboutStoryImage',
    dimension: '800x800px',
    title: 'Sobre — imagem ao lado da história',
    hint: 'Ex.: /logo_draw.png',
    kind: 'image',
  },
  {
    key: 'aboutPillarsImage',
    dimension: '1200x1200px',
    title: 'Sobre — imagem dos pilares',
    hint: 'Quadrado ao lado dos textos dos pilares.',
    kind: 'image',
  },
  {
    key: 'franchiseHeroBg',
    dimension: '1900x1080px',
    title: 'Franquia — imagem lateral do hero',
    hint: 'Metade direita no desktop.',
    kind: 'image',
  },
  {
    key: 'franchiseHeroVideo',
    title: 'Franquia — vídeo do hero',
    hint: 'Ex.: /franquia.mp4',
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Caminho relativo — host resolvido no render (ver lib/mediaUrl.ts).
      onUploaded(await uploadFile(file, file.name));
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
    aspect?: string;
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

      <div className="space-y-10">
        {FIELD_META.map(({ key, title, hint, kind, dimension }) => {
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
                  <p className="text-xs text-amber-600/90 mt-2">URL vazia</p>
                ) : kind === 'image' ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCropField({ key, aspect: aspectFromDimension(dimension) })
                    }
                    className="mt-2 inline-flex items-center gap-1.5 self-start text-xs text-zinc-400 hover:text-eagle-gold transition-colors"
                  >
                    <Pencil size={12} />
                    Editar imagem
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <ImageCropModal
        open={cropField !== null}
        value={cropField ? media[cropField.key] : ''}
        aspect={cropField?.aspect}
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

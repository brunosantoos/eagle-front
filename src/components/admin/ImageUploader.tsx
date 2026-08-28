/// <reference types="vite/client" />
import { memo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { describeCompression, uploadFileDetailed } from '../../lib/upload';
import { ImageCropModal, type ImageEffectsConfig } from './ImageCropModal';

function ImageUploaderInner({
  value,
  onChange,
  label = 'Imagem',
  aspect = '16/9',
  maxWidth = '220px',
  hint,
  fieldNote,
  effects,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Proporção exata do espaço no site — vira o preset "Campo do site". */
  aspect?: string;
  maxWidth?: string;
  /** Texto auxiliar exibido sob o label (ex.: dimensão recomendada). */
  hint?: string;
  /** Observação sobre o enquadramento, exibida no editor de recorte. */
  fieldNote?: string;
  /** Máscara e desfoque do campo, editáveis no modal. Ausente = só recorte. */
  effects?: ImageEffectsConfig;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  /** Resumo da compressão do último envio (ex.: '9.15 MB → 180 KB'). */
  const [compressionNote, setCompressionNote] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Arquivo precisa ser uma imagem.');
      return;
    }
    setUploading(true);
    setError(null);
    setCompressionNote(null);
    try {
      // Grava caminho relativo — o host entra no render (ver lib/mediaUrl.ts).
      const result = await uploadFileDetailed(file, file.name);
      onChange(result.url);
      setCompressionNote(describeCompression(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-300 tracking-wide">{label}</p>
      {hint && (
        <p className="text-[11px] font-medium text-eagle-gold/90">{hint}</p>
      )}
      <div
        className="relative rounded-xl border border-zinc-700/70 bg-zinc-950/40 overflow-hidden group w-full"
        style={{ aspectRatio: aspect, maxWidth }}
      >
        {value ? (
          <img
            src={resolveMediaUrl(value)}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.35'; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <ImageIcon size={28} strokeWidth={1.5} />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/65 backdrop-blur-sm text-white text-xs font-semibold opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Upload size={14} />
              {value ? 'Trocar imagem' : 'Selecionar imagem'}
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {!uploading && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <button
            type="button"
            onClick={handlePick}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-eagle-gold transition-colors"
          >
            <Upload size={12} />
            {value ? 'Enviar outra imagem' : 'Enviar arquivo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-eagle-gold transition-colors"
            >
              <Pencil size={12} />
              Editar imagem
            </button>
          )}
          {/*
            Esvazia o campo. O arquivo continua no servidor — sai só a
            referência, e dá para voltar atrás enquanto a seção não for salva.
          */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setCompressionNote(null);
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
              Remover imagem
            </button>
          )}
        </div>
      )}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {!error && compressionNote && (
        <p className="text-[11px] text-emerald-400/90">{compressionNote}</p>
      )}
      <ImageCropModal
        open={editOpen}
        value={value}
        aspect={aspect}
        fieldLabel={label}
        fieldNote={fieldNote}
        effects={effects}
        onClose={() => setEditOpen(false)}
        onCropped={(url) => onChange(url)}
      />
    </div>
  );
}

/**
 * Re-renderiza só quando a própria imagem (ou seu enquadramento) muda.
 *
 * Os callbacks ficam fora da comparação porque o dashboard os recria a cada
 * tecla digitada em qualquer campo da seção — e cada preview aqui é um `<img>`
 * de verdade sendo remontado à toa.
 */
export const ImageUploader = memo(
  ImageUploaderInner,
  (prev, next) =>
    prev.value === next.value &&
    prev.label === next.label &&
    prev.aspect === next.aspect &&
    prev.maxWidth === next.maxWidth &&
    prev.hint === next.hint &&
    prev.fieldNote === next.fieldNote &&
    prev.effects === next.effects,
);

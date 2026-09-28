/// <reference types="vite/client" />
import { memo, useRef, useState } from 'react';
import { Loader2, Trash2, Upload, Video } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { uploadFile } from '../../lib/upload';

/**
 * Campo de vídeo do painel — irmão do `ImageUploader`, mesmas regras:
 * escolher o arquivo já envia, arrastar e soltar funciona, e o que falta
 * depois é salvar a seção.
 */

function VideoUploaderInner({
  value,
  onChange,
  label = 'Vídeo',
  maxWidth = '320px',
  hint,
  where,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxWidth?: string;
  /** Texto auxiliar exibido sob o label. */
  hint?: string;
  /** Onde o vídeo aparece no site. */
  where?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Arquivo precisa ser um vídeo.');
      return;
    }
    setUploading(true);
    setError(null);
    setJustUploaded(false);
    try {
      // Grava caminho relativo — o host entra no render (ver lib/mediaUrl.ts).
      onChange(await uploadFile(file, file.name));
      setJustUploaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-zinc-300 tracking-wide">{label}</p>
        {where && (
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
            {where}
          </p>
        )}
      </div>
      {hint && (
        <p className="text-[11px] font-medium text-eagle-gold/90">{hint}</p>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !uploading) void handleFile(file);
        }}
        className={`relative rounded-xl border bg-zinc-950/40 overflow-hidden w-full transition-colors ${
          dragging
            ? 'border-eagle-gold ring-2 ring-eagle-gold/30'
            : 'border-zinc-700/70'
        }`}
        style={{ maxWidth }}
      >
        {value ? (
          <video
            key={value}
            src={resolveMediaUrl(value)}
            muted
            playsInline
            controls
            className="w-full max-h-[200px]"
          />
        ) : (
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center text-zinc-600 gap-1.5 py-10 hover:text-zinc-400 transition-colors"
          >
            <Video size={26} strokeWidth={1.5} />
            <span className="text-xs">Sem vídeo</span>
            <span className="text-[10px] text-zinc-700">
              Clique ou arraste um arquivo
            </span>
          </button>
        )}
        {(uploading || dragging) && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold">
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Upload size={14} />
                Solte para enviar
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-eagle-gold transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Upload size={12} />
              {value ? 'Trocar vídeo' : 'Enviar vídeo'}
            </>
          )}
        </button>
        {/*
          Esvazia o campo. O arquivo continua no servidor — sai só a referência,
          e dá para voltar atrás enquanto a seção não for salva.
        */}
        {value && !uploading && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setJustUploaded(false);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            Remover vídeo
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {!error && justUploaded && (
        <p className="text-[11px] text-emerald-400/90">
          Vídeo enviado. Salve a seção para publicar no site.
        </p>
      )}
    </div>
  );
}

/** Mesmo motivo do ImageUploader: o `<video>` de preview não pode remontar a cada tecla. */
export const VideoUploader = memo(
  VideoUploaderInner,
  (prev, next) =>
    prev.value === next.value &&
    prev.label === next.label &&
    prev.maxWidth === next.maxWidth &&
    prev.hint === next.hint &&
    prev.where === next.where,
);

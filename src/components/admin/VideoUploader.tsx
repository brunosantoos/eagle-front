/// <reference types="vite/client" />
import { useRef, useState } from 'react';
import { Loader2, Upload, Video } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { uploadFile } from '../../lib/upload';

export function VideoUploader({
  value,
  onChange,
  label = 'Vídeo',
  maxWidth = '320px',
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxWidth?: string;
  /** Texto auxiliar exibido sob o label. */
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Arquivo precisa ser um vídeo.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Grava caminho relativo — o host entra no render (ver lib/mediaUrl.ts).
      onChange(await uploadFile(file, file.name));
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
        className="relative rounded-xl border border-zinc-700/70 bg-zinc-950/40 overflow-hidden w-full"
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
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-2 py-10">
            <Video size={28} strokeWidth={1.5} />
            <span className="text-xs">Sem vídeo</span>
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
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

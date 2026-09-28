/// <reference types="vite/client" />
import { memo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Pencil, Trash2, Upload } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { describeCompression, uploadFileDetailed } from '../../lib/upload';
import { ImageCropModal, type ImageEffectsConfig } from './ImageCropModal';

/**
 * Campo de imagem do painel.
 *
 * Regra que vale em todo lugar: **escolher o arquivo já envia**. Não existe um
 * segundo botão de "enviar" — a aba Mídias tinha um, e era o principal motivo
 * de "subi a imagem e não mudou nada": quem escolhia o arquivo achava que tinha
 * acabado. O que sobra para o usuário fazer depois é salvar a seção, e disso
 * cuida a barra no fim da tela.
 *
 * Arrastar e soltar em cima do preview faz o mesmo que clicar.
 */

function ImageUploaderInner({
  value,
  onChange,
  label = 'Imagem',
  aspect,
  maxWidth = '220px',
  hint,
  where,
  fieldNote,
  effects,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /**
   * Proporção exata do espaço no site — vira o preset "Campo do site" no
   * editor de recorte. **Ausente de propósito** em logo e ilustração: o site
   * exibe a imagem inteira, então o preview não corta e o recorte abre em
   * "Original".
   */
  aspect?: string;
  maxWidth?: string;
  /** Texto auxiliar exibido sob o label (ex.: dimensão recomendada). */
  hint?: string;
  /** Onde a imagem aparece no site — a frase que dispensa adivinhação. */
  where?: string;
  /** Observação sobre o enquadramento, exibida no editor de recorte. */
  fieldNote?: string;
  /** Máscara e desfoque do campo, editáveis no modal. Ausente = só recorte. */
  effects?: ImageEffectsConfig;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** Resumo da compressão do último envio (ex.: '9.15 MB → 180 KB'). */
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  /** Some sozinho no próximo envio — é só a confirmação de que o upload foi. */
  const [justUploaded, setJustUploaded] = useState(false);

  const handlePick = () => inputRef.current?.click();

  /** A moldura precisa de alguma forma mesmo quando o campo não tem proporção fixa. */
  const frameAspect = aspect ?? '16/9';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Arquivo precisa ser uma imagem.');
      return;
    }
    setUploading(true);
    setError(null);
    setCompressionNote(null);
    setJustUploaded(false);
    try {
      // Grava caminho relativo — o host entra no render (ver lib/mediaUrl.ts).
      const result = await uploadFileDetailed(file, file.name);
      onChange(result.url);
      setCompressionNote(describeCompression(result));
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
        className={`relative rounded-xl border bg-zinc-950/40 overflow-hidden group w-full transition-colors ${
          dragging
            ? 'border-eagle-gold border-solid ring-2 ring-eagle-gold/30'
            : 'border-zinc-700/70'
        }`}
        style={{ aspectRatio: frameAspect, maxWidth }}
      >
        {value ? (
          <img
            src={resolveMediaUrl(value)}
            alt=""
            className={`w-full h-full ${aspect ? 'object-cover' : 'object-contain p-2'}`}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.35'; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-1.5 px-3 text-center">
            <ImageIcon size={26} strokeWidth={1.5} />
            <span className="text-xs">Sem imagem</span>
            <span className="text-[10px] text-zinc-700">
              Clique ou arraste um arquivo
            </span>
          </div>
        )}
        {/*
          O overlay cobre o preview inteiro: a área clicável é a imagem toda,
          não um botãozinho. Fica sempre visível enquanto envia e quando o
          arquivo está sendo arrastado por cima.
        */}
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className={`absolute inset-0 flex items-center justify-center gap-2 bg-black/65 backdrop-blur-sm text-white text-xs font-semibold transition-opacity focus-visible:opacity-100 disabled:cursor-not-allowed ${
            uploading || dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Enviando…
            </>
          ) : dragging ? (
            <>
              <Upload size={14} />
              Solte para enviar
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
                setJustUploaded(false);
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
      {!error && justUploaded && (
        <p className="text-[11px] text-emerald-400/90">
          Imagem enviada. Salve a seção para publicar no site.
          {compressionNote ? ` · ${compressionNote}` : ''}
        </p>
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
 *
 * `effects` é comparado **valor a valor**, e não por referência: o dashboard
 * monta esse objeto na hora do render, então comparar a referência reprovaria
 * sempre e a memoização não valeria nada justo nos campos que a têm.
 */
export const ImageUploader = memo(
  ImageUploaderInner,
  (prev, next) =>
    prev.value === next.value &&
    prev.label === next.label &&
    prev.aspect === next.aspect &&
    prev.maxWidth === next.maxWidth &&
    prev.hint === next.hint &&
    prev.where === next.where &&
    prev.fieldNote === next.fieldNote &&
    Boolean(prev.effects) === Boolean(next.effects) &&
    prev.effects?.maskEnabled === next.effects?.maskEnabled &&
    prev.effects?.maskOpacity === next.effects?.maskOpacity &&
    prev.effects?.blur === next.effects?.blur &&
    prev.effects?.hint === next.effects?.hint,
);

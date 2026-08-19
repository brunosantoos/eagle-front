import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Contrast,
  Crop,
  Droplets,
  ImageIcon,
  Loader2,
  Maximize2,
  Move,
  RotateCcw,
  X,
  ZoomIn,
} from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { uploadFile } from '../../lib/upload';

/** Presets de proporção. `ratio: null` = proporção original da imagem. */
const ASPECT_PRESETS: { id: string; label: string; ratio: number | null }[] = [
  { id: 'original', label: 'Original', ratio: null },
  { id: '16/9', label: '16:9', ratio: 16 / 9 },
  { id: '4/3', label: '4:3', ratio: 4 / 3 },
  { id: '1/1', label: '1:1', ratio: 1 },
  { id: '4/5', label: '4:5', ratio: 4 / 5 },
  { id: '9/16', label: '9:16', ratio: 9 / 16 },
];

/** Largura máxima do arquivo gerado — evita salvar 6000px de largura no servidor. */
const MAX_OUTPUT_WIDTH = 1920;

function parseAspect(aspect?: string): number | null {
  if (!aspect) return null;
  const [w, h] = aspect.split('/').map((n) => Number(n.trim()));
  if (!w || !h) return null;
  return w / h;
}

function nearestPresetId(ratio: number | null): string {
  if (ratio === null) return 'original';
  let best = ASPECT_PRESETS[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const preset of ASPECT_PRESETS) {
    if (preset.ratio === null) continue;
    const diff = Math.abs(preset.ratio - ratio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = preset;
    }
  }
  return bestDiff < 0.02 ? best.id : 'original';
}

/**
 * Efeitos da imagem no site: máscara escura e desfoque. Editados aqui e
 * aplicados no render — não alteram o arquivo, então dá pra desligar depois.
 */
export type ImageEffectsConfig = {
  maskEnabled: boolean;
  /** 0–100. */
  maskOpacity: number;
  /** 0–20 px. */
  blur: number;
  onChange: (next: {
    maskEnabled: boolean;
    maskOpacity: number;
    blur: number;
  }) => void;
  /** Explicação de onde a imagem aparece no site. */
  hint?: string;
};

/**
 * Editor de imagem: enquadramento (recorte) e máscara.
 *
 * O recorte carrega a imagem atual do campo, deixa arrastar/dar zoom dentro da
 * moldura da proporção escolhida e gera um arquivo novo (canvas → upload), sem
 * biblioteca externa nem processamento no servidor.
 *
 * A máscara é aplicada ao conteúdo do site (quando o campo tem uma), então ela
 * é salva junto com a seção — não altera o arquivo da imagem.
 */
export function ImageCropModal({
  open,
  value,
  aspect,
  effects,
  onClose,
  onCropped,
}: {
  open: boolean;
  /** URL atual do campo (relativa ou absoluta). */
  value: string;
  /** Proporção sugerida pelo campo, ex.: '16/9'. */
  aspect?: string;
  /** Efeitos reais do campo. Ausente = só prévia local, sem efeito no site. */
  effects?: ImageEffectsConfig;
  onClose: () => void;
  /** Recebe o caminho relativo do arquivo recortado já enviado. */
  onCropped: (url: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  const [presetId, setPresetId] = useState(() => nearestPresetId(parseAspect(aspect)));
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskPreview, setMaskPreview] = useState(false);

  // Com efeitos reais, a prévia usa os valores do conteúdo; sem eles, o toggle local.
  const maskOn = effects ? effects.maskEnabled : maskPreview;
  const maskOpacity = effects
    ? Math.min(100, Math.max(0, effects.maskOpacity)) / 100
    : 0.6;
  const previewBlur = effects ? Math.min(20, Math.max(0, effects.blur)) : 0;

  /** Muda um efeito mantendo os outros. */
  const patchEffects = (
    next: Partial<{ maskEnabled: boolean; maskOpacity: number; blur: number }>,
  ) => {
    if (!effects) return;
    effects.onChange({
      maskEnabled: effects.maskEnabled,
      maskOpacity: effects.maskOpacity,
      blur: effects.blur,
      ...next,
    });
  };

  const src = useMemo(() => resolveMediaUrl(value), [value]);

  const presetRatio = ASPECT_PRESETS.find((p) => p.id === presetId)?.ratio ?? null;
  const frameRatio =
    presetRatio ?? (natural ? natural.w / natural.h : parseAspect(aspect) ?? 16 / 9);

  // Carrega a imagem (crossOrigin para o canvas não ficar "tainted" quando o
  // backend está em outro domínio — /uploads responde com ACAO: *).
  useEffect(() => {
    if (!open || !src) return;
    setLoading(true);
    setError(null);
    setNatural(null);
    imageRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'sync';
    img.onload = () => {
      imageRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
      setError('Não foi possível carregar a imagem para recorte.');
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [open, src]);

  // Mede a moldura para calcular o recorte em pixels reais da imagem.
  useLayoutEffect(() => {
    if (!open) return;
    const el = frameRef.current;
    if (!el) return;
    const measure = () =>
      setFrame({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, frameRatio]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, saving]);

  /** Escala mínima que cobre a moldura inteira (equivalente a object-fit: cover). */
  const baseScale = useMemo(() => {
    if (!natural || !frame.w || !frame.h) return 1;
    return Math.max(frame.w / natural.w, frame.h / natural.h);
  }, [natural, frame]);

  const effScale = baseScale * zoom;
  const displayed = natural
    ? { w: natural.w * effScale, h: natural.h * effScale }
    : { w: 0, h: 0 };

  const clampOffset = useCallback(
    (next: { x: number; y: number }) => {
      const maxX = Math.max(0, (displayed.w - frame.w) / 2);
      const maxY = Math.max(0, (displayed.h - frame.h) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [displayed.w, displayed.h, frame.w, frame.h],
  );

  // Zoom/proporção novos podem deixar a imagem fora dos limites — reancora.
  useEffect(() => {
    setOffset((prev) => clampOffset(prev));
  }, [clampOffset]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (loading || saving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset(
      clampOffset({
        x: drag.originX + (e.clientX - drag.startX),
        y: drag.originY + (e.clientY - drag.startY),
      }),
    );
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (loading || saving) return;
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    const img = imageRef.current;
    if (!img || !natural || !frame.w || !frame.h) return;
    setSaving(true);
    setError(null);
    try {
      // Retângulo visível dentro da moldura, convertido para pixels da imagem original.
      const x0 = (frame.w - displayed.w) / 2 + offset.x;
      const y0 = (frame.h - displayed.h) / 2 + offset.y;
      const sx = Math.max(0, -x0 / effScale);
      const sy = Math.max(0, -y0 / effScale);
      const sw = Math.min(natural.w - sx, frame.w / effScale);
      const sh = Math.min(natural.h - sy, frame.h / effScale);

      const outW = Math.max(1, Math.round(Math.min(sw, MAX_OUTPUT_WIDTH)));
      const outH = Math.max(1, Math.round(outW * (sh / sw)));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não disponível neste navegador.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', 0.92);
      });
      const finalBlob =
        blob ??
        (await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
        }));
      if (!finalBlob) throw new Error('Não foi possível gerar a imagem recortada.');

      const ext = finalBlob.type === 'image/webp' ? 'webp' : 'jpg';
      const url = await uploadFile(finalBlob, `recorte-${outW}x${outH}.${ext}`);
      onCropped(url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar o recorte.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 animate-[fadeIn_140ms_ease-out]">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        aria-label="Fechar"
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editar imagem"
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 animate-[modalIn_160ms_ease-out]"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-zinc-800/80">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-heading font-bold text-white">
              <ImageIcon size={18} className="text-eagle-gold" />
              Editar imagem
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Ajuste o enquadramento{effects ? ', a máscara escura e o desfoque' : ''} desta imagem.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPresetId(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  presetId === preset.id
                    ? 'bg-eagle-red text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={onWheel}
            style={{ aspectRatio: String(frameRatio) }}
            className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-black touch-none select-none cursor-grab active:cursor-grabbing"
          >
            {natural && !loading ? (
              <img
                src={src}
                alt=""
                draggable={false}
                crossOrigin="anonymous"
                style={{
                  width: displayed.w,
                  height: displayed.h,
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))${
                    previewBlur > 0 ? ' scale(1.04)' : ''
                  }`,
                  ...(previewBlur > 0 ? { filter: `blur(${previewBlur}px)` } : {}),
                }}
                className="absolute max-w-none pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 gap-2 text-sm">
                {error ? error : (<><Loader2 size={16} className="animate-spin" /> Carregando imagem…</>)}
              </div>
            )}

            {maskOn && (
              <div
                className="absolute inset-0 bg-eagle-black pointer-events-none"
                style={{ opacity: maskOpacity }}
              />
            )}

            {/* Guias de terços — ajuda a alinhar o assunto principal. */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
            </div>

            {!loading && !error && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-zinc-300 pointer-events-none">
                <Move size={11} /> arraste para posicionar
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 mb-1.5">
                <ZoomIn size={13} className="text-eagle-gold" />
                Zoom: <span className="text-eagle-gold font-semibold">{zoom.toFixed(2)}x</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={loading || saving}
                className="w-full accent-red-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={reset}
                disabled={loading || saving}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-eagle-gold transition-colors disabled:opacity-50"
              >
                <RotateCcw size={13} />
                Reiniciar enquadramento
              </button>
              {!effects && (
                <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={maskPreview}
                    onChange={(e) => setMaskPreview(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-600 bg-eagle-black accent-red-600"
                  />
                  Prévia com máscara escura
                </label>
              )}
              {natural && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Maximize2 size={12} />
                  original {natural.w}×{natural.h}px
                </span>
              )}
            </div>
          </div>

          {effects && (
            <div className="rounded-xl border border-zinc-800 bg-eagle-black/40 p-4 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={effects.maskEnabled}
                    onChange={(e) => patchEffects({ maskEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-600 bg-eagle-black accent-red-600"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                    <Contrast size={14} className="text-eagle-gold" />
                    Máscara escura sobre a imagem
                  </span>
                </label>
                {effects.maskEnabled && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Intensidade da máscara:{' '}
                      <span className="text-eagle-gold font-semibold">
                        {effects.maskOpacity}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={effects.maskOpacity}
                      onChange={(e) =>
                        patchEffects({ maskOpacity: Number(e.target.value) })
                      }
                      className="w-full accent-red-600"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={effects.blur > 0}
                    onChange={(e) =>
                      patchEffects({ blur: e.target.checked ? 6 : 0 })
                    }
                    className="h-4 w-4 rounded border-zinc-600 bg-eagle-black accent-red-600"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                    <Droplets size={14} className="text-eagle-gold" />
                    Desfoque (blur) na imagem
                  </span>
                </label>
                {effects.blur > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Intensidade do desfoque:{' '}
                      <span className="text-eagle-gold font-semibold">{effects.blur}px</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={effects.blur}
                      onChange={(e) => patchEffects({ blur: Number(e.target.value) })}
                      className="w-full accent-red-600"
                    />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {effects.hint ?? 'Máscara e desfoque ajudam o texto por cima a ficar legível.'}{' '}
                Valem no site depois de salvar a seção — não alteram o arquivo da imagem.
              </p>
            </div>
          )}

          {error && !loading && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 p-5 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving || !natural}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 text-white text-sm font-heading font-semibold ring-1 ring-red-500/30 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Salvando recorte…
              </>
            ) : (
              <>
                <Crop size={15} />
                Aplicar recorte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

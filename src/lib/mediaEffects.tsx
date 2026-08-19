import type { CSSProperties } from 'react';
import {
  DEFAULT_MEDIA_EFFECT,
  type MediaEffect,
  type SiteContent,
} from './siteContent';

/**
 * Efeitos por imagem (máscara escura + desfoque), configurados no Admin em
 * Mídias > Editar imagem.
 *
 * Ficam no render, não no arquivo: ligar/desligar não perde a imagem original.
 */

export function getMediaEffect(
  content: SiteContent,
  key: string,
): MediaEffect {
  const stored = content.mediaEffects?.[key];
  if (!stored) return DEFAULT_MEDIA_EFFECT;
  return {
    maskEnabled: Boolean(stored.maskEnabled),
    maskOpacity: clampPercent(stored.maskOpacity),
    blur: clampBlur(stored.blur),
  };
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function clampBlur(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(20, Math.max(0, value));
}

/** Estilo de desfoque para aplicar direto no `<img>`. */
export function blurStyle(effect: MediaEffect): CSSProperties | undefined {
  const blur = clampBlur(effect.blur);
  return blur > 0
    ? // `scale` disfarça a borda transparente que o blur cria nas extremidades.
      { filter: `blur(${blur}px)`, transform: 'scale(1.04)' }
    : undefined;
}

/**
 * Camada de máscara escura. Renderiza `null` quando desligada, então dá pra usar
 * direto no JSX sem condicional extra. Precisa de um pai `relative`.
 */
export function MediaMask({ effect }: { effect: MediaEffect }) {
  if (!effect.maskEnabled) return null;
  return (
    <div
      className="absolute inset-0 bg-eagle-black pointer-events-none"
      style={{ opacity: clampPercent(effect.maskOpacity) / 100 }}
      aria-hidden
    />
  );
}

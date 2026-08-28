import type { CSSProperties } from 'react';
import { fontFamilyOf } from './fonts';
import {
  DEFAULT_TEXT_STYLE,
  type SiteContent,
  type TextStyle,
} from './siteContent';

/**
 * Da formatação salva no painel para o `style` inline do elemento.
 *
 * Só entra no objeto o que o admin realmente configurou: campo vazio some do
 * `style` e o texto continua com a classe do Tailwind que o site já tinha. É o
 * que faz "não mexi em nada" e "está como sempre esteve" serem a mesma coisa.
 */

/** Formatação de um campo, ou o padrão quando ele nunca foi configurado. */
export function textStyleAt(content: SiteContent, path: string): TextStyle {
  return content.textStyles[path] ?? DEFAULT_TEXT_STYLE;
}

/** Quanto o texto encolhe no celular em relação ao tamanho do desktop. */
const MOBILE_SCALE = 0.65;

/** Piso absoluto — abaixo disso o texto fica ilegível no celular. */
const MIN_PX = 12;

/** Larguras de viewport entre as quais o tamanho cresce. */
const MIN_VIEWPORT = 360;
const MAX_VIEWPORT = 1280;

/**
 * Tamanho fluido a partir de um número só.
 *
 * O admin escolhe o tamanho que quer no desktop; entre 360px e 1280px de tela o
 * valor desce proporcionalmente até `MOBILE_SCALE`. Sem isso, um título de 64px
 * escolhido no computador estoura a tela do celular — e obrigar o cliente a
 * configurar dois tamanhos por campo seria pedir para ele errar.
 */
export function fluidFontSize(px: number): string {
  const max = Math.max(1, Math.round(px));
  const min = Math.max(MIN_PX, Math.round(max * MOBILE_SCALE));
  if (min >= max) return `${max}px`;

  const slopeVw = ((max - min) / (MAX_VIEWPORT - MIN_VIEWPORT)) * 100;
  const interceptPx = min - (slopeVw * MIN_VIEWPORT) / 100;
  return `clamp(${min}px, ${interceptPx.toFixed(2)}px + ${slopeVw.toFixed(3)}vw, ${max}px)`;
}

export function toCssTextStyle(style: TextStyle): CSSProperties {
  const css: CSSProperties = {};

  const family = style.font ? fontFamilyOf(style.font) : null;
  if (family) css.fontFamily = family;
  if (style.fontSize !== null) css.fontSize = fluidFontSize(style.fontSize);
  if (style.weight !== null) css.fontWeight = style.weight;
  if (style.caseTransform) css.textTransform = style.caseTransform;
  if (style.align) css.textAlign = style.align;
  if (style.color) css.color = style.color;
  if (style.letterSpacing !== null) {
    css.letterSpacing = `${style.letterSpacing}px`;
  }
  if (style.lineHeight !== null) css.lineHeight = style.lineHeight;

  return css;
}

/**
 * Valor de um campo pelo caminho (`about.pillarsIntro`,
 * `home.workouts.0.title`) — a mesma chave usada em `textStyles`, para que o
 * render precise informar o caminho uma vez só.
 */
export function stringAtPath(content: SiteContent, path: string): string {
  let current: unknown = content;
  for (const segment of path.split('.')) {
    if (Array.isArray(current)) current = current[Number(segment)];
    else if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else return '';
  }
  return typeof current === 'string' ? current : '';
}

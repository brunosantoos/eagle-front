/** Helpers de cor usados pelos seletores do painel. */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** '#abc' / 'abc' / '#AABBCC' -> '#aabbcc'. Devolve null se não for hex válido. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#*/, '');
  const hex = `#${raw}`;
  if (!HEX_RE.test(hex)) return null;
  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  return hex.toLowerCase();
}

/** Só os dígitos hex digitáveis (sem '#'), em minúsculo. */
export function sanitizeHexInput(input: string): string {
  return input.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toLowerCase();
}

/**
 * Cor completa o suficiente para aplicar enquanto o usuário digita.
 *
 * Só 6 dígitos: aceitar 3 no meio da digitação faria "cb0c0c" aplicar #ccbb00
 * ao passar por "cb0", trocando a cor e atrapalhando quem ainda está digitando.
 * O formato de 3 dígitos continua valendo ao confirmar (Enter/blur).
 */
export function hexReadyToApply(input: string): string | null {
  const digits = sanitizeHexInput(input);
  return digits.length === 6 ? normalizeHex(digits) : null;
}

/** Preto ou branco, o que tiver mais contraste sobre a cor dada. */
export function pickContrast(hex: string): string {
  const normalized = normalizeHex(hex) ?? '#000000';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  // Luminância relativa aproximada (ITU-R BT.601).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

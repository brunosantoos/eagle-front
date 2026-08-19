/**
 * Máscara de telefone brasileiro, aplicada enquanto o usuário digita.
 *
 * Formatos: `(00) 0000-0000` (fixo) e `(00) 00000-0000` (celular).
 * A formatação é progressiva — parênteses/hífen só aparecem quando há dígito
 * para eles, senão apagar caractere fica travado.
 */
export function formatPhone(value: string): string {
  let raw = value.replace(/\D/g, '');
  // Colar com DDI ("+55 19 99912-3456") não pode transformar o 55 em DDD.
  if (raw.length > 11 && raw.startsWith('55')) raw = raw.slice(2);
  const digits = raw.slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  // Até 10 dígitos = fixo (4+4); a partir do 11º = celular (5+4).
  const breakpoint = digits.length > 10 ? 5 : 4;

  if (rest.length <= breakpoint) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, breakpoint)}-${rest.slice(breakpoint)}`;
}

/** Só os dígitos — útil para `tel:` e comparações. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

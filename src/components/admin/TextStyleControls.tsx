import { useEffect, useId, useRef, useState } from 'react';
import { CaseSensitive, RotateCcw } from 'lucide-react';
import { PopoverPanel } from './PopoverPanel';
import {
  ensureFontsLoaded,
  FONT_CATALOG,
  fontsByCategory,
} from '../../lib/fonts';
import {
  DEFAULT_TEXT_STYLE,
  isDefaultTextStyle,
  type TextAlign,
  type TextCase,
  type TextStyle,
} from '../../lib/siteContent';
import { toCssTextStyle } from '../../lib/textStyle';

/**
 * Formatação de um campo de texto: fonte, tamanho, peso, caixa, alinhamento,
 * cor, espaçamento e altura da linha.
 *
 * Fica num popover ao lado do campo em vez de expandido no formulário: são
 * quase noventa campos de texto no painel: mostrar oito controles em cada um
 * deixaria a tela ilegível. O botão marca com um ponto quando o campo tem
 * formatação própria, então dá para varrer a página e ver o que foi mexido.
 *
 * Todo controle tem a opção "padrão", que devolve o campo para a aparência
 * original do site — nenhuma configuração aqui é um caminho sem volta.
 */

const CASE_OPTIONS: { value: TextCase; label: string }[] = [
  { value: '', label: 'Padrão' },
  { value: 'none', label: 'Como escrito' },
  { value: 'uppercase', label: 'MAIÚSCULAS' },
  { value: 'lowercase', label: 'minúsculas' },
  { value: 'capitalize', label: 'Primeira Maiúscula' },
];

const ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: '', label: 'Padrão' },
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
  { value: 'justify', label: 'Justificado' },
];

const WEIGHT_OPTIONS: { value: number; label: string }[] = [
  { value: 300, label: 'Fina' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Média' },
  { value: 600, label: 'Semi-negrito' },
  { value: 700, label: 'Negrito' },
  { value: 800, label: 'Extra-negrito' },
  { value: 900, label: 'Máximo' },
];

const selectCls =
  'w-full bg-eagle-black border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-eagle-red';
const numberCls =
  'w-full bg-eagle-black border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-eagle-red';
const rowLabelCls = 'block text-[11px] text-zinc-400 mb-1';

/** Campo numérico onde vazio significa "padrão do site". */
function OptionalNumber({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className={rowLabelCls} htmlFor={id}>
        {label}
        {suffix ? <span className="text-zinc-600"> ({suffix})</span> : null}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        placeholder="Padrão"
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === '') return onChange(null);
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : null);
        }}
        className={numberCls}
      />
    </div>
  );
}

export function TextStyleControls({
  label,
  value,
  onChange,
}: {
  /** Nome do campo, exibido no cabeçalho do popover. */
  label: string;
  value: TextStyle;
  onChange: (next: TextStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const customized = !isDefaultTextStyle(value);

  // Com o painel aberto vale baixar o catálogo inteiro: sem isso a lista
  // mostraria todos os nomes na mesma fonte e escolher viraria adivinhação.
  useEffect(() => {
    if (open) ensureFontsLoaded(FONT_CATALOG.map((f) => f.id));
  }, [open]);

  const patch = (partial: Partial<TextStyle>) =>
    onChange({ ...value, ...partial });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Formatação de "${label}"`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative inline-flex items-center gap-1 shrink-0 rounded-lg border px-2 py-1 text-[11px] transition-colors ${
          open || customized
            ? 'border-eagle-gold/60 bg-eagle-gold/10 text-eagle-gold'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-eagle-gold hover:border-zinc-600'
        }`}
      >
        <CaseSensitive size={13} aria-hidden />
        Formatar
        {customized && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-eagle-gold shadow-[0_0_6px_rgba(224,198,128,0.8)]"
          />
        )}
      </button>

      <PopoverPanel
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        width={272}
        ariaLabel={`Formatação de ${label}`}
      >
        <div className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-white leading-tight">
              {label}
            </p>
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_TEXT_STYLE })}
              disabled={!customized}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-eagle-gold disabled:opacity-40 disabled:hover:text-zinc-500 transition-colors shrink-0"
            >
              <RotateCcw size={11} aria-hidden />
              Padrão
            </button>
          </div>

          <div>
            <label className={rowLabelCls}>Letra</label>
            <select
              value={value.font}
              onChange={(e) => patch({ font: e.target.value })}
              className={selectCls}
            >
              <option value="">Padrão do site</option>
              {fontsByCategory().map((group) => {
                const fonts = group.fonts.filter((f) => f.id !== 'default');
                if (fonts.length === 0) return null;
                return (
                  <optgroup key={group.category} label={group.category}>
                    {fonts.map((font) => (
                      <option
                        key={font.id}
                        value={font.id}
                        style={{ fontFamily: font.family ?? undefined }}
                      >
                        {font.label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <OptionalNumber
              label="Tamanho"
              suffix="px"
              value={value.fontSize}
              onChange={(fontSize) => patch({ fontSize })}
              min={8}
              max={200}
            />
            <div>
              <label className={rowLabelCls}>Espessura</label>
              <select
                value={value.weight ?? ''}
                onChange={(e) =>
                  patch({
                    weight: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className={selectCls}
              >
                <option value="">Padrão</option>
                {WEIGHT_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={rowLabelCls}>Caixa</label>
              <select
                value={value.caseTransform}
                onChange={(e) =>
                  patch({ caseTransform: e.target.value as TextCase })
                }
                className={selectCls}
              >
                {CASE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={rowLabelCls}>Posição</label>
              <select
                value={value.align}
                onChange={(e) => patch({ align: e.target.value as TextAlign })}
                className={selectCls}
              >
                {ALIGN_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={rowLabelCls}>Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.color || '#ffffff'}
                onChange={(e) => patch({ color: e.target.value })}
                className="h-8 w-12 shrink-0 rounded-lg border border-zinc-700 bg-eagle-black cursor-pointer p-1"
              />
              <span className="text-[11px] text-zinc-400 flex-1 truncate">
                {value.color || 'Padrão do site'}
              </span>
              {value.color && (
                <button
                  type="button"
                  onClick={() => patch({ color: '' })}
                  className="shrink-0 text-[11px] text-zinc-500 hover:text-eagle-gold transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <OptionalNumber
              label="Entre letras"
              suffix="px"
              value={value.letterSpacing}
              onChange={(letterSpacing) => patch({ letterSpacing })}
              min={-5}
              max={20}
              step={0.5}
            />
            <OptionalNumber
              label="Entre linhas"
              value={value.lineHeight}
              onChange={(lineHeight) => patch({ lineHeight })}
              min={0.8}
              max={3}
              step={0.1}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-eagle-black/60 p-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">
              Prévia
            </p>
            <p
              className="text-white text-sm break-words"
              style={toCssTextStyle(value)}
            >
              Eagle Center Fitness
            </p>
          </div>

          <p className="text-[10px] text-zinc-600 leading-relaxed">
            O tamanho vale para o computador; no celular ele diminui sozinho.
            Quem fica em &quot;Padrão&quot; segue a aparência original do site.
          </p>
        </div>
      </PopoverPanel>
    </>
  );
}

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Palette, Type } from 'lucide-react';
import { PopoverPanel } from './PopoverPanel';
import {
  hexReadyToApply,
  normalizeHex,
  pickContrast,
  sanitizeHexInput,
} from '../../lib/color';

type FontOption = {
  id: 'default' | 'vonique';
  label: string;
  hint: string;
  family: string | null;
};

const FONT_OPTIONS: FontOption[] = [
  { id: 'default', label: 'Padrão', hint: 'texto do site', family: null },
  { id: 'vonique', label: 'Destaque Eagle', hint: 'estilo logotipo', family: "'Vonique 43', cursive" },
];

function FontPicker({
  value,
  onChange,
}: {
  value: FontOption['id'];
  onChange: (id: FontOption['id']) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current = FONT_OPTIONS.find((o) => o.id === value) ?? FONT_OPTIONS[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Fonte do texto"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 transition-colors ${
          open ? 'bg-zinc-700 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
        }`}
      >
        <Type size={12} className="text-zinc-400" />
        <span style={{ fontFamily: current.family ?? undefined }}>{current.label}</span>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPanel
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Fonte do texto"
        width={220}
      >
        <div className="p-1">
          {FONT_OPTIONS.map((opt) => {
            const active = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left transition-colors ${active ? 'bg-eagle-red/15 text-white' : 'hover:bg-zinc-800 text-zinc-200'}`}
              >
                <div className="min-w-0">
                  <p className="text-sm leading-tight" style={{ fontFamily: opt.family ?? undefined }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{opt.hint}</p>
                </div>
                {active && <Check size={14} className="text-eagle-red shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverPanel>
    </>
  );
}

/** Branco, preto e as cores da marca (tokens de `index.css`). */
const COLOR_SWATCHES: { label: string; value: string }[] = [
  { label: 'Branco', value: '#ffffff' },
  { label: 'Preto', value: '#000000' },
  { label: 'Vermelho Eagle', value: '#cb0c0c' },
  { label: 'Dourado Eagle', value: '#e0c680' },
  { label: 'Claro Eagle', value: '#f5f5f5' },
  { label: 'Cinza Eagle', value: '#a3a3a3' },
  { label: 'Grafite Eagle', value: '#1a1a1a' },
  { label: 'Escuro Eagle', value: '#0a0a0a' },
];

/**
 * Cor do texto — aplica na seleção; sem seleção, vale para o que for digitado
 * em seguida (comportamento padrão de mark do Tiptap).
 */
function ColorPicker({
  value,
  onChange,
  onClear,
}: {
  /** Cor ativa no cursor, ou '' quando é a cor padrão do site. */
  value: string;
  onChange: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  const current = normalizeHex(value) ?? '';

  // Sincroniza só na abertura: reagir a `current` durante a digitação faria o
  // campo se reescrever sozinho a cada tecla.
  useEffect(() => {
    if (open) setHexDraft(current ? current.replace('#', '') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Confirmação explícita (Enter/blur): aceita 3 ou 6 dígitos. */
  const commitHex = () => {
    const hex = normalizeHex(hexDraft);
    if (hex) onChange(hex);
  };

  const hexValid = hexDraft === '' || normalizeHex(hexDraft) !== null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Cor do texto"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
          open ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
        }`}
      >
        <Palette size={12} className="text-zinc-400" />
        <span
          className="h-3.5 w-3.5 rounded-full border border-zinc-500/70 shadow-inner"
          style={
            current
              ? { backgroundColor: current }
              : {
                  // Padrão do site: xadrez discreto em vez de quadrado vazio.
                  backgroundImage:
                    'linear-gradient(45deg, #52525b 25%, transparent 25%, transparent 75%, #52525b 75%), linear-gradient(45deg, #52525b 25%, transparent 25%, transparent 75%, #52525b 75%)',
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 3px 3px',
                  backgroundColor: '#18181b',
                }
          }
          aria-hidden
        />
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPanel
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Cor do texto"
        width={224}
      >
        <div className="px-3 pt-2.5 pb-2 flex items-center justify-between gap-2 border-b border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wide">
            Cor do texto
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            {current || 'padrão'}
          </span>
        </div>

        <div className="p-3 space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_SWATCHES.map((swatch) => {
              const active = current === swatch.value.toLowerCase();
              return (
                <button
                  key={swatch.value}
                  type="button"
                  title={swatch.label}
                  aria-label={swatch.label}
                  aria-pressed={active}
                  onMouseDown={(e) => { e.preventDefault(); onChange(swatch.value); setOpen(false); }}
                  className={`relative h-8 w-full rounded-md border transition-all hover:-translate-y-0.5 ${
                    active
                      ? 'border-transparent ring-2 ring-eagle-gold ring-offset-2 ring-offset-zinc-900'
                      : 'border-zinc-700/80 hover:border-zinc-500'
                  }`}
                  style={{ backgroundColor: swatch.value }}
                >
                  {active && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="absolute inset-0 m-auto"
                      style={{ color: pickContrast(swatch.value) }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
              Personalizada
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Abrir seletor de cores"
                aria-label="Abrir seletor de cores"
                onMouseDown={(e) => { e.preventDefault(); nativeRef.current?.click(); }}
                className="relative h-8 w-8 shrink-0 rounded-md border border-zinc-700 hover:border-zinc-500 transition-colors overflow-hidden"
                style={{
                  background: current
                    ? current
                    : 'conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)',
                }}
              >
                {/* input nativo invisível: só serve para abrir o seletor do SO */}
                <input
                  ref={nativeRef}
                  type="color"
                  value={current || '#ffffff'}
                  onChange={(e) => onChange(e.target.value)}
                  tabIndex={-1}
                  aria-hidden
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                />
              </button>

              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  #
                </span>
                <input
                  type="text"
                  spellCheck={false}
                  maxLength={7}
                  placeholder="cb0c0c"
                  value={hexDraft}
                  onChange={(e) => {
                    const digits = sanitizeHexInput(e.target.value);
                    setHexDraft(digits);
                    // Aplica sozinho só com hex completo (ver lib/color.ts).
                    const ready = hexReadyToApply(digits);
                    if (ready) onChange(ready);
                  }}
                  onBlur={commitHex}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitHex(); setOpen(false); }
                  }}
                  className={`w-full bg-zinc-950 border rounded-md pl-5 pr-2 py-1.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                    hexValid
                      ? 'border-zinc-700 focus:border-eagle-red'
                      : 'border-red-700 focus:border-red-500'
                  }`}
                />
              </div>
            </div>
            {!hexValid && (
              <p className="text-[10px] text-red-400">Use 3 ou 6 dígitos, ex.: cb0c0c</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClear(); setOpen(false); }}
          className="w-full px-3 py-2 text-left text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 border-t border-zinc-800 transition-colors"
        >
          Usar cor padrão do site
        </button>
      </PopoverPanel>
    </>
  );
}

const btnCls = (active: boolean) =>
  `px-2 py-1 rounded text-xs font-medium transition-colors ${active ? 'bg-eagle-red text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      Underline,
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[100px] max-h-[320px] overflow-y-auto px-3 py-2 text-sm text-white focus:outline-none prose prose-invert prose-sm max-w-none',
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      const current = editor.isEmpty ? '' : editor.getHTML();
      if (value !== current) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    } catch {
      // editor not ready yet
    }
  }, [value, editor]);

  if (!editor) return null;

  const heading = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : 'p';

  const font = editor.isActive({ fontFamily: "'Vonique 43', cursive" })
    ? 'vonique'
    : 'default';

  // '' = sem cor explícita, ou seja, herda a cor padrão do site.
  const activeColor = (editor.getAttributes('textStyle').color as string | undefined) ?? '';

  return (
    <div className="rounded-lg border border-zinc-700 bg-eagle-black focus-within:border-eagle-red focus-within:ring-1 focus-within:ring-eagle-red/40 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-zinc-700 bg-zinc-900/60">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={btnCls(editor.isActive('bold'))}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={btnCls(editor.isActive('italic'))}
          style={{ fontStyle: 'italic' }}
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          className={btnCls(editor.isActive('underline'))}
          style={{ textDecoration: 'underline' }}
        >
          U
        </button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* Font size via headings */}
        <select
          value={heading}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v.replace('h', '')) as 1|2|3 }).run();
          }}
          className="bg-zinc-800 text-zinc-300 text-xs rounded px-2 py-1 border-0 focus:outline-none"
        >
          <option value="p">Normal</option>
          <option value="h3">Médio</option>
          <option value="h2">Grande</option>
          <option value="h1">Maior</option>
        </select>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
          className={btnCls(editor.isActive({ textAlign: 'left' }))}
          title="Esquerda"
        >
          ≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
          className={btnCls(editor.isActive({ textAlign: 'center' }))}
          title="Centro"
        >
          ☰
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
          className={btnCls(editor.isActive({ textAlign: 'right' }))}
          title="Direita"
        >
          ≡
        </button>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* Font family */}
        <FontPicker
          value={font}
          onChange={(id) => {
            const opt = FONT_OPTIONS.find((o) => o.id === id);
            if (opt?.family) {
              editor.chain().focus().setFontFamily(opt.family).run();
            } else {
              editor.chain().focus().unsetFontFamily().run();
            }
          }}
        />

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* Cor do texto */}
        <ColorPicker
          value={activeColor}
          onChange={(color) => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />
      </div>

      {/* Editor area */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <span className="absolute top-2 left-3 text-sm text-zinc-500 pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

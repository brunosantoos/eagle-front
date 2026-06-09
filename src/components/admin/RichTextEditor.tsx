import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Type } from 'lucide-react';

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
  const ref = useRef<HTMLDivElement>(null);
  const current = FONT_OPTIONS.find((o) => o.id === value) ?? FONT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title="Fonte do texto"
        className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 transition-colors"
      >
        <Type size={12} className="text-zinc-400" />
        <span style={{ fontFamily: current.family ?? undefined }}>{current.label}</span>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/50 p-1">
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
      )}
    </div>
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

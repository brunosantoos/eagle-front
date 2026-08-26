import { useEffect } from 'react';
import { Check, Type } from 'lucide-react';
import {
  ensureFontsLoaded,
  FONT_CATALOG,
  fontById,
  fontsByCategory,
} from '../../lib/fonts';
import type { SiteContent } from '../../lib/siteContent';

type Typography = SiteContent['typography'];

/** Onde cada fonte é aplicada, em linguagem de quem edita o site. */
const SLOTS: {
  key: keyof Typography;
  title: string;
  description: string;
  sample: string;
  sampleClass: string;
}[] = [
  {
    key: 'heading',
    title: 'Títulos',
    description:
      'Os títulos de seção do site inteiro (ex.: "Por que ser um franqueado").',
    sample: 'Excelência, tradição e ação',
    sampleClass: 'text-2xl font-bold',
  },
  {
    key: 'body',
    title: 'Texto corrido',
    description:
      'Parágrafos, descrições, itens de lista e textos dos formulários.',
    sample:
      'Uma experiência exclusiva focada em bem-estar, conforto e resultados.',
    sampleClass: 'text-base',
  },
  {
    key: 'display',
    title: 'Destaque',
    description:
      'As chamadas grandes no estilo do logotipo (hero da Home e da página Sobre).',
    sample: 'SOBRE NÓS',
    sampleClass: 'text-3xl font-bold uppercase tracking-tight',
  },
];

/** A opção "Padrão do site" não faz sentido aqui: este painel é quem a define. */
const SELECTABLE = FONT_CATALOG.filter((f) => f.id !== 'default');

function FontGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {fontsByCategory()
        .map((group) => ({
          ...group,
          fonts: group.fonts.filter((f) => SELECTABLE.includes(f)),
        }))
        .filter((group) => group.fonts.length > 0)
        .map((group) => (
          <div key={group.category} className="col-span-full">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 mt-2 first:mt-0">
              {group.category}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.fonts.map((font) => {
                const active = font.id === value;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => onChange(font.id)}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                      active
                        ? 'border-eagle-red bg-eagle-red/10'
                        : 'border-zinc-700/70 bg-zinc-950/40 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm text-white truncate"
                        style={{ fontFamily: font.family ?? undefined }}
                      >
                        {font.label}
                      </span>
                      {active && (
                        <Check size={14} className="text-eagle-red shrink-0" />
                      )}
                    </div>
                    <span className="block text-[10px] text-zinc-500 mt-0.5 truncate">
                      {font.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}

export function AdminTypographyPanel({
  value,
  onChange,
}: {
  value: Typography;
  onChange: (next: Typography) => void;
}) {
  // Sem isso as amostras sairiam todas na mesma fonte e a escolha viraria
  // adivinhação — no painel o custo de baixar o catálogo é aceitável.
  useEffect(() => {
    ensureFontsLoaded(FONT_CATALOG.map((f) => f.id));
  }, []);

  return (
    <div className="space-y-8">
      <p className="text-xs text-zinc-500 -mt-1">
        Todas as fontes desta lista têm acentuação completa (á, ã, ç, ê, õ). A
        escolha vale para o site inteiro; para trocar a fonte de um texto
        específico, use o seletor de fonte dentro do próprio campo de texto.
      </p>

      {SLOTS.map((slot) => {
        const selected = value[slot.key];
        const font = fontById(selected);
        return (
          <div
            key={slot.key}
            className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-4 space-y-4"
          >
            <div className="flex items-start gap-2">
              <Type size={16} className="text-eagle-gold shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-heading font-semibold text-white">
                  {slot.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">{slot.description}</p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-black/40 px-4 py-5">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">
                Prévia — {font?.label ?? selected}
              </p>
              <p
                className={`text-white ${slot.sampleClass}`}
                style={{ fontFamily: font?.family ?? undefined }}
              >
                {slot.sample}
              </p>
            </div>

            <FontGrid
              value={selected}
              onChange={(id) => onChange({ ...value, [slot.key]: id })}
            />
          </div>
        );
      })}
    </div>
  );
}

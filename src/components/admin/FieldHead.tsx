import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { TextStyleControls } from './TextStyleControls';
import {
  DEFAULT_TEXT_STYLE,
  isDefaultTextStyle,
  type TextStyle,
} from '../../lib/siteContent';

/**
 * Cabeçalho de um campo do painel: o rótulo e, ao lado, o botão de formatação.
 *
 * A formatação vive num mapa à parte (`content.textStyles`), com o caminho do
 * campo como chave — o mesmo caminho que o site usa no `<SiteText>`. Passar
 * esse mapa por prop até cada um dos quase noventa campos seria ruído puro, daí
 * o contexto: o formulário continua escrevendo só o texto, e o `FieldHead`
 * cuida do resto.
 */

type TextStyleDraft = {
  styleAt: (path: string) => TextStyle;
  setStyle: (path: string, next: TextStyle) => void;
};

const TextStyleDraftContext = createContext<TextStyleDraft | null>(null);

export function TextStyleDraftProvider({
  styles,
  onChange,
  children,
}: {
  styles: Record<string, TextStyle>;
  onChange: (next: Record<string, TextStyle>) => void;
  children: ReactNode;
}) {
  const styleAt = useCallback(
    (path: string) => styles[path] ?? DEFAULT_TEXT_STYLE,
    [styles],
  );

  const setStyle = useCallback(
    (path: string, next: TextStyle) => {
      const updated = { ...styles };
      // Campo devolvido ao padrão sai do mapa em vez de virar entrada zerada —
      // o JSON do site vai inteiro no save, não vale carregar peso morto.
      if (isDefaultTextStyle(next)) delete updated[path];
      else updated[path] = next;
      onChange(updated);
    },
    [styles, onChange],
  );

  const value = useMemo(() => ({ styleAt, setStyle }), [styleAt, setStyle]);

  return (
    <TextStyleDraftContext.Provider value={value}>
      {children}
    </TextStyleDraftContext.Provider>
  );
}

export function FieldHead({
  label,
  path,
  title,
}: {
  label: ReactNode;
  /** Caminho do campo no conteúdo. Ausente = campo sem formatação (URL, etc.). */
  path?: string;
  /** Nome no popover, quando o rótulo não é texto puro. */
  title?: string;
}) {
  const ctx = useContext(TextStyleDraftContext);

  return (
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <label className="block text-xs font-medium text-zinc-300 tracking-wide">
        {label}
      </label>
      {path && ctx ? (
        <TextStyleControls
          label={title ?? (typeof label === 'string' ? label : path)}
          value={ctx.styleAt(path)}
          onChange={(next) => ctx.setStyle(path, next)}
        />
      ) : null}
    </div>
  );
}

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { useSiteContent } from '../../context/SiteContentProvider';
import { stringAtPath, textStyleAt, toCssTextStyle } from '../../lib/textStyle';

/**
 * Texto do site com a formatação configurada no painel.
 *
 * `path` é o caminho do campo no conteúdo (`about.pillarsIntro`) e serve para
 * as duas coisas ao mesmo tempo: buscar o texto e buscar a formatação. Assim
 * cada ponto do site declara o campo uma vez só e não há como o texto e a
 * formatação apontarem para lugares diferentes.
 *
 * As classes do Tailwind continuam definindo a aparência padrão; o que o admin
 * configurar vira `style` inline, que ganha delas. Nada configurado = a página
 * renderiza exatamente como antes.
 */
export type SiteTextProps = {
  /** Caminho do campo, ex.: `home.hero.eyebrow` ou `home.workouts.0.title`. */
  path: string;
  /** Tag renderizada. Padrão: `span`. */
  as?: ElementType;
  /** Texto pronto, quando não vem direto do caminho (valor derivado). */
  value?: string;
  /** true para campos de rich text (o valor é HTML). */
  html?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Para `as="label"`. */
  htmlFor?: string;
} & Omit<
  HTMLAttributes<HTMLElement>,
  'className' | 'style' | 'children' | 'dangerouslySetInnerHTML'
>;

export function SiteText({
  path,
  as: Tag = 'span',
  value,
  html = false,
  className,
  style,
  children,
  ...rest
}: SiteTextProps) {
  const { content } = useSiteContent();
  const text = value ?? stringAtPath(content, path);
  // O `style` da página é a base; a formatação do campo vem depois e ganha.
  // As configurações antigas de cor por seção (o `titleColor` do segundo hero,
  // as cores do carrossel) chegam por `style` — quem mexer na cor do campo
  // específico espera que a escolha mais específica seja a que aparece.
  const css = { ...style, ...toCssTextStyle(textStyleAt(content, path)) };

  if (html) {
    return (
      <Tag
        {...rest}
        className={className}
        style={css}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <Tag {...rest} className={className} style={css}>
      {children ?? text}
    </Tag>
  );
}

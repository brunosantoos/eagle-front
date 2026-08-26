import { useEffect } from 'react';
import {
  collectUsedFontIds,
  ensureFontsLoaded,
  fontFamilyOf,
} from './fonts';
import type { SiteContent } from './siteContent';

/**
 * Aplica a tipografia escolhida no painel e baixa só as fontes que o conteúdo
 * realmente usa.
 *
 * As três variáveis abaixo são as mesmas declaradas no `@theme` do
 * `index.css`, então `font-sans`, `font-heading` e `font-vonique` (as classes
 * usadas no site inteiro) passam a seguir a configuração sem precisar tocar em
 * nenhum componente. Estilo inline no elemento raiz ganha da folha de estilo.
 */
export function useSiteFonts(content: SiteContent): void {
  const { heading, body, display } = content.typography;

  useEffect(() => {
    // Fontes da configuração + as escolhidas dentro dos textos do rich text.
    ensureFontsLoaded([
      heading,
      body,
      display,
      ...collectUsedFontIds(content),
    ]);
  }, [content, heading, body, display]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (variable: string, id: string) => {
      const family = fontFamilyOf(id);
      if (family) root.style.setProperty(variable, family);
      else root.style.removeProperty(variable);
    };

    apply('--font-sans', body);
    apply('--font-heading', heading);
    apply('--font-vonique', display);
  }, [heading, body, display]);
}

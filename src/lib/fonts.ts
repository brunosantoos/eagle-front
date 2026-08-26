/**
 * Catálogo de fontes do site — a "listagem de letras" do painel.
 *
 * Regras que valem para toda fonte daqui:
 *
 * - **Todas têm acentuação completa** (subset `latin-ext`). É o requisito que
 *   originou o catálogo: fonte sem `ã`/`ç` quebra texto em português.
 * - Nenhuma é carregada de entrada. `ensureFontsLoaded()` injeta o `<link>` só
 *   quando a fonte é de fato usada — o site público baixa apenas o que aparece
 *   nele, e o painel carrega o catálogo inteiro porque lá o custo é aceitável.
 * - Adicionar fonte = incluir uma entrada em `FONT_CATALOG`. Nada mais.
 */

export type FontId =
  | 'default'
  | 'inter'
  | 'montserrat'
  | 'vonique'
  | 'oswald'
  | 'anton'
  | 'bebas'
  | 'playfair'
  | 'merriweather'
  | 'lora'
  | 'roboto-slab'
  | 'poppins'
  | 'raleway'
  | 'nunito'
  | 'roboto'
  | 'open-sans'
  | 'courier';

export type FontOption = {
  id: FontId;
  /** Nome exibido no painel — sem jargão tipográfico. */
  label: string;
  /** Pista curta de uso, exibida sob o nome. */
  hint: string;
  /** Stack CSS completa. `null` = usa a fonte padrão do site. */
  family: string | null;
  /**
   * Trecho da query do Google Fonts (`family=...`). `null` para fonte que não
   * vem de lá: a padrão, a Vonique (cdnfonts, já no index.html) e as de sistema.
   */
  google: string | null;
  category: 'Do site' | 'Destaque' | 'Com serifa' | 'Sem serifa' | 'Máquina de escrever';
};

export const FONT_CATALOG: FontOption[] = [
  {
    id: 'default',
    label: 'Padrão do site',
    hint: 'a fonte de texto configurada',
    family: null,
    google: null,
    category: 'Do site',
  },
  {
    id: 'vonique',
    label: 'Destaque Eagle',
    hint: 'estilo do logotipo',
    family: "'Vonique 43', 'Oswald', sans-serif",
    google: null,
    category: 'Destaque',
  },
  {
    id: 'inter',
    label: 'Inter',
    hint: 'texto do site',
    family: "'Inter', sans-serif",
    google: 'Inter:wght@300;400;500;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    hint: 'títulos do site',
    family: "'Montserrat', sans-serif",
    google: 'Montserrat:wght@300;400;500;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'anton',
    label: 'Anton',
    hint: 'título curto, bem grosso',
    family: "'Anton', sans-serif",
    google: 'Anton',
    category: 'Destaque',
  },
  {
    id: 'bebas',
    label: 'Bebas Neue',
    hint: 'condensada, tudo maiúsculo',
    family: "'Bebas Neue', sans-serif",
    google: 'Bebas+Neue',
    category: 'Destaque',
  },
  {
    id: 'oswald',
    label: 'Oswald',
    hint: 'condensada, boa em chamada',
    family: "'Oswald', sans-serif",
    google: 'Oswald:wght@300;400;500;600;700',
    category: 'Destaque',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    hint: 'elegante, com serifa',
    family: "'Playfair Display', serif",
    google: 'Playfair+Display:wght@400;500;600;700',
    category: 'Com serifa',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    hint: 'texto longo, com serifa',
    family: "'Merriweather', serif",
    google: 'Merriweather:wght@300;400;700',
    category: 'Com serifa',
  },
  {
    id: 'lora',
    label: 'Lora',
    hint: 'serifa leve, texto corrido',
    family: "'Lora', serif",
    google: 'Lora:wght@400;500;600;700',
    category: 'Com serifa',
  },
  {
    id: 'roboto-slab',
    label: 'Roboto Slab',
    hint: 'serifa quadrada',
    family: "'Roboto Slab', serif",
    google: 'Roboto+Slab:wght@300;400;500;700',
    category: 'Com serifa',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    hint: 'arredondada, moderna',
    family: "'Poppins', sans-serif",
    google: 'Poppins:wght@300;400;500;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'raleway',
    label: 'Raleway',
    hint: 'fina, para chamadas',
    family: "'Raleway', sans-serif",
    google: 'Raleway:wght@300;400;500;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    hint: 'arredondada, amigável',
    family: "'Nunito', sans-serif",
    google: 'Nunito:wght@300;400;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    hint: 'neutra, muito legível',
    family: "'Roboto', sans-serif",
    google: 'Roboto:wght@300;400;500;700',
    category: 'Sem serifa',
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    hint: 'neutra, texto corrido',
    family: "'Open Sans', sans-serif",
    google: 'Open+Sans:wght@300;400;600;700',
    category: 'Sem serifa',
  },
  {
    id: 'courier',
    label: 'Courier',
    hint: 'estilo máquina de escrever',
    family: "'Courier New', Courier, monospace",
    google: null,
    category: 'Máquina de escrever',
  },
];

const BY_ID = new Map(FONT_CATALOG.map((f) => [f.id, f]));

export function fontById(id: string): FontOption | undefined {
  return BY_ID.get(id as FontId);
}

/** Stack CSS da fonte, ou `undefined` para a padrão do site. */
export function fontFamilyOf(id: string): string | undefined {
  return fontById(id)?.family ?? undefined;
}

/** Id da fonte a partir da stack CSS gravada no HTML do rich text. */
export function fontIdOfFamily(family: string | undefined | null): FontId {
  if (!family) return 'default';
  const normalized = family.trim().toLowerCase();
  const hit = FONT_CATALOG.find(
    (f) => f.family && f.family.toLowerCase() === normalized,
  );
  if (hit) return hit.id;
  // Tolera stack levemente diferente (aspas trocadas, fallback removido):
  // compara só o primeiro nome da lista.
  const first = normalized.split(',')[0].replace(/['"]/g, '').trim();
  return (
    FONT_CATALOG.find(
      (f) =>
        f.family &&
        f.family.split(',')[0].replace(/['"]/g, '').trim().toLowerCase() ===
          first,
    )?.id ?? 'default'
  );
}

/** Catálogo agrupado por categoria, na ordem em que aparece no painel. */
export function fontsByCategory(): { category: string; fonts: FontOption[] }[] {
  const groups: { category: string; fonts: FontOption[] }[] = [];
  for (const font of FONT_CATALOG) {
    const group = groups.find((g) => g.category === font.category);
    if (group) group.fonts.push(font);
    else groups.push({ category: font.category, fonts: [font] });
  }
  return groups;
}

/**
 * Inter e Montserrat já vêm por `<link>` estático no `index.html` (são as fontes
 * padrão, presentes em toda página — pedir por JS só atrasaria). Marcar as duas
 * como carregadas evita `<link>` duplicado quando alguém as escolhe no painel.
 */
const loaded = new Set<string>(['inter', 'montserrat']);

/**
 * Injeta o `<link>` do Google Fonts das fontes pedidas, uma única vez cada.
 *
 * Uma requisição por fonte (em vez de uma com tudo) é proposital: assim uma
 * página que usa duas fontes não baixa as dezesseis, e o cache do navegador é
 * reaproveitado entre páginas que compartilham a mesma fonte.
 */
export function ensureFontsLoaded(ids: Iterable<string>): void {
  if (typeof document === 'undefined') return;

  for (const id of ids) {
    const font = fontById(id);
    if (!font?.google || loaded.has(font.id)) continue;
    loaded.add(font.id);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // `latin-ext` garante os acentuados; `display=swap` evita texto invisível
    // enquanto a fonte baixa.
    link.href = `https://fonts.googleapis.com/css2?family=${font.google}&subset=latin,latin-ext&display=swap`;
    document.head.appendChild(link);
  }
}

/**
 * Ids de fonte realmente usados em um conteúdo de site.
 *
 * O rich text grava `font-family: ...` no HTML, e as configurações de
 * tipografia guardam ids. Uma varredura no JSON pega os dois casos sem precisar
 * percorrer a árvore campo a campo.
 */
export function collectUsedFontIds(content: unknown): FontId[] {
  const json = JSON.stringify(content) ?? '';
  const used = new Set<FontId>();

  for (const font of FONT_CATALOG) {
    if (font.id === 'default') continue;
    const name = font.family?.split(',')[0].replace(/['"]/g, '').trim();
    if (!name) continue;

    // Casar só depois de `font-family:` — procurar o nome solto acusaria
    // "Lora" dentro de "Flora" e faria o site baixar fonte que não usa.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inRichText = new RegExp(
      `font-family:\\s*\\\\?['"]?${escaped}`,
      'i',
    ).test(json);

    // Configuração de tipografia: o id aparece como valor de campo.
    const inTypography = json.includes(`"${font.id}"`);

    if (inRichText || inTypography) used.add(font.id);
  }

  return [...used];
}

import type { SiteMedia } from './siteContent';

/**
 * Catálogo dos campos de `content.media` — o que cada imagem é, onde ela
 * aparece no site e em que proporção.
 *
 * Existe porque a mesma imagem é editada em dois lugares: dentro da aba da
 * página (Sobre > Hero troca `aboutHeroBg` ali mesmo) e na biblioteca em
 * Admin > Mídias, que mostra tudo junto. Antes cada tela carregava sua própria
 * lista de rótulos e proporções, e a única que existia era a da biblioteca —
 * era por isso que trocar a foto da Sobre exigia sair da Sobre.
 *
 * `aspect` é a proporção **real** do espaço no site, medida no componente que
 * exibe a imagem — não é sugestão de tamanho. Ausente = a imagem aparece
 * inteira (logo, ilustração) e o recorte abre em "Original".
 */

export type MediaGroup = 'nav-footer' | 'home' | 'about' | 'franchise';

export type MediaFieldMeta = {
  key: keyof SiteMedia;
  kind: 'image' | 'video';
  /** Rótulo curto — usado dentro da aba da página, onde o contexto já é claro. */
  label: string;
  /** Onde aparece no site, na língua de quem nunca leu o código. */
  where: string;
  /** Dimensão recomendada para quem vai preparar o arquivo. */
  dimension?: string;
  /** Proporção exata do espaço no site, ex.: '735/791'. */
  aspect?: string;
  /** Explicação do enquadramento, exibida no editor de recorte. */
  note?: string;
  /** Página do site — agrupa a biblioteca em Admin > Mídias. */
  group: MediaGroup;
  /** Rótulo da página, para o cabeçalho do grupo. */
  groupLabel: string;
  /**
   * Preenchido só nas imagens que o site desenha com máscara/desfoque; é a
   * frase mostrada no editor de efeitos. Ausente = campo só permite recorte.
   */
  effectHint?: string;
  /** Campo que o site não lê hoje — fica na biblioteca, mas sinalizado. */
  unused?: boolean;
};

export const MEDIA_FIELDS: MediaFieldMeta[] = [
  {
    key: 'navLogo',
    kind: 'image',
    label: 'Logo do menu',
    where: 'Canto esquerdo do menu, em todas as páginas.',
    dimension: '360x120px',
    note: 'Aparece inteiro no menu, sem corte — envie com fundo transparente.',
    group: 'nav-footer',
    groupLabel: 'Menu e rodapé',
  },
  {
    key: 'navEagle',
    kind: 'image',
    label: 'Águia do menu',
    where: 'Símbolo ao lado do logo, no menu.',
    dimension: '200x200px',
    note: 'Aparece inteiro no menu, sem corte.',
    group: 'nav-footer',
    groupLabel: 'Menu e rodapé',
  },
  {
    key: 'footerLogo',
    kind: 'image',
    label: 'Logo do rodapé',
    where: 'Topo do rodapé, em todas as páginas.',
    dimension: '360x120px',
    note: 'Aparece inteiro no rodapé, sem corte.',
    group: 'nav-footer',
    groupLabel: 'Menu e rodapé',
  },
  {
    key: 'homeHeroVideo',
    kind: 'video',
    label: 'Vídeo padrão do banner',
    where:
      'Banner de abertura da Home — usado quando a aba Home > Banner não tem vídeo próprio.',
    dimension: 'MP4 na horizontal (1920x1080px)',
    group: 'home',
    groupLabel: 'Home',
  },
  {
    key: 'homeSecondHeroBg',
    kind: 'image',
    label: 'Fundo do segundo bloco',
    where: 'Imagem de tela cheia atrás do título principal da Home.',
    dimension: '1920x1080px',
    aspect: '16/9',
    note: 'Preenche a tela inteira (altura de 100vh). Deixe o essencial no centro: as bordas somem em telas mais estreitas.',
    group: 'home',
    groupLabel: 'Home',
    effectHint: 'Fundo do segundo bloco da Home, atrás do título principal.',
  },
  {
    key: 'homeExperienceImage',
    kind: 'image',
    label: 'Imagem da experiência',
    where: 'Ao lado da lista de diferenciais, na Home.',
    dimension: '1200x1250px',
    aspect: '24/25',
    note: 'Bloco de altura fixa (600px) ao lado do texto — quase quadrado no desktop.',
    group: 'home',
    groupLabel: 'Home',
    effectHint: 'Imagem ao lado da lista de diferenciais, na Home.',
  },
  {
    key: 'homeFranchiseTeaserImage',
    kind: 'image',
    label: 'Imagem do bloco franquia',
    where: 'Bloco de chamada para franquia, no fim da Home.',
    dimension: '735x791px',
    aspect: '735/791',
    note: 'Proporção fixa no site (735:791) — este recorte é exatamente o que aparece.',
    group: 'home',
    groupLabel: 'Home',
    effectHint: 'Imagem do bloco de franquia no fim da Home.',
  },
  {
    key: 'aboutHeroBg',
    kind: 'image',
    label: 'Fundo do topo',
    where: 'Faixa no topo da página Sobre, atrás do título.',
    dimension: '1920x1080px',
    aspect: '16/9',
    note: 'Faixa larga no topo da página (altura mínima de 60vh), com o título por cima.',
    group: 'about',
    groupLabel: 'Sobre',
    effectHint: 'Foto do topo da página Sobre, atrás do título.',
  },
  {
    key: 'aboutStoryImage',
    kind: 'image',
    label: 'Imagem da história',
    where: 'Ao lado do texto "Nossa história", na página Sobre.',
    dimension: '800x800px',
    note: 'Aparece inteira, na proporção do arquivo — não é cortada pelo site.',
    group: 'about',
    groupLabel: 'Sobre',
    effectHint: 'Imagem ao lado do texto "Nossa história".',
  },
  {
    key: 'aboutPillarsImage',
    kind: 'image',
    label: 'Imagem dos pilares',
    where: 'Quadrado ao lado dos pilares da marca, na página Sobre.',
    dimension: '1200x1200px',
    aspect: '1/1',
    note: 'Quadrado exato no site (aspect-square).',
    group: 'about',
    groupLabel: 'Sobre',
    effectHint: 'Imagem quadrada ao lado dos pilares da marca.',
  },
  {
    key: 'franchiseHeroVideo',
    kind: 'video',
    label: 'Vídeo do topo',
    where: 'Vídeo em pé (9:16) no topo da página Franquia.',
    dimension: 'MP4 na vertical (1080x1920px)',
    group: 'franchise',
    groupLabel: 'Franquia',
  },
  {
    key: 'franchiseHeroBg',
    kind: 'image',
    label: 'Imagem lateral do topo',
    where: 'Nada: o topo da Franquia mostra o vídeo, e esta imagem não é lida pelo site.',
    dimension: '1920x1080px',
    group: 'franchise',
    groupLabel: 'Franquia',
    unused: true,
  },
];

export const MEDIA_FIELD_BY_KEY = Object.fromEntries(
  MEDIA_FIELDS.map((field) => [field.key, field]),
) as Record<keyof SiteMedia, MediaFieldMeta>;

/** Campos de uma página, na ordem em que aparecem no site. */
export function mediaFieldsOf(group: MediaGroup): MediaFieldMeta[] {
  return MEDIA_FIELDS.filter((field) => field.group === group);
}

export const MEDIA_GROUP_ORDER: MediaGroup[] = [
  'nav-footer',
  'home',
  'about',
  'franchise',
];
